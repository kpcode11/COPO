import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db/prisma'
import { updateConfigSchema } from '@/schemas/admin/config.schema'
import { createAudit } from '@/lib/db/audit'

export async function GET(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(me)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const config = await prisma.globalConfig.findFirst()
    return NextResponse.json({ config })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(me)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = updateConfigSchema.parse(body)

    // Fetch current config
    const prev = await prisma.globalConfig.findFirst()

    // Build update data
    const updateData: any = {}
    for (const key of Object.keys(parsed)) {
      (updateData as any)[key] = (parsed as any)[key]
    }

    // Upsert: if no config exists, create default first
    let newConfig
    if (!prev) {
      newConfig = await prisma.globalConfig.create({ data: { ...updateData } })
    } else {
      newConfig = await prisma.globalConfig.update({ where: { id: prev.id }, data: updateData })
    }

    // Versioning: store a history entry
    const changes = { before: prev ?? null, after: newConfig }
    const lastHist = await prisma.globalConfigHistory.findFirst({ orderBy: { createdAt: 'desc' } })
    const version = (lastHist?.version ?? 0) + 1

    await prisma.globalConfigHistory.create({ data: { globalConfigId: newConfig.id, changedBy: me.id, changes, version } })

    await createAudit(me.id, 'UPDATE_GLOBAL_CONFIG', 'GlobalConfig', newConfig.id, `Updated global config v${version}`)

    return NextResponse.json({ config: newConfig })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}