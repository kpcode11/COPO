import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(me)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params
    const semester = await prisma.semester.findUnique({ where: { id } })
    if (!semester) return NextResponse.json({ error: 'Semester not found' }, { status: 404 })

    if (semester.isLocked) return NextResponse.json({ error: 'Semester already locked' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined

    const updated = await prisma.semester.update({ where: { id }, data: { isLocked: true } })

    await createAudit(me.id, 'LOCK_SEMESTER', 'Semester', id, `Locked semester${reason ? `: ${reason}` : ''}`)

    return NextResponse.json({ semester: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}