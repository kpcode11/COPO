import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db/prisma'
import { createAuditSchema } from '@/schemas/admin/audit.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(me)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const entity = url.searchParams.get('entity') || undefined
    const action = url.searchParams.get('action') || undefined
    const userId = url.searchParams.get('userId') || undefined
    const since = url.searchParams.get('since') ? new Date(url.searchParams.get('since')!) : undefined
    const until = url.searchParams.get('until') ? new Date(url.searchParams.get('until')!) : undefined
    const page = Number(url.searchParams.get('page') || '1')
    const perPageRaw = Number(url.searchParams.get('perPage') || '50')
    const perPage = Math.min(100, Math.max(1, isNaN(perPageRaw) ? 50 : perPageRaw))

    const where: any = {}
    if (entity) where.entity = entity
    if (action) where.action = action
    if (userId) where.userId = userId
    if (since || until) {
      where.createdAt = {}
      if (since) where.createdAt.gte = since
      if (until) where.createdAt.lte = until
    }

    const total = await prisma.auditLog.count({ where })
    const logs = await prisma.auditLog.findMany({ 
      where, 
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' }, 
      skip: (page - 1) * perPage, 
      take: perPage 
    })

    return NextResponse.json({ page, perPage, total, logs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    // Allow Admin users or internal system calls via header
    const me = await getCurrentUser(req)
    const internalToken = req.headers.get('x-internal-audit-token') || process.env.INTERNAL_AUDIT_TOKEN

    const body = await req.json()
    const parsed = createAuditSchema.parse(body)

    if (!me && !internalToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (me && !isAdmin(me) && !internalToken) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // If internal token is set as a header, ensure it matches env token
    if (req.headers.get('x-internal-audit-token') && req.headers.get('x-internal-audit-token') !== process.env.INTERNAL_AUDIT_TOKEN) {
      return NextResponse.json({ error: 'Invalid internal token' }, { status: 401 })
    }

    // Use the provided userId as the actor in audit record
    const record = await createAudit(parsed.userId, parsed.action, parsed.entity, parsed.entityId, parsed.details)
    return NextResponse.json({ audit: record })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}