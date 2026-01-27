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

    if (!semester.isLocked) return NextResponse.json({ error: 'Semester is not locked' }, { status: 400 })

    const body = await req.json()
    const reason = typeof body.reason === 'string' && body.reason.trim().length > 0 ? body.reason.trim() : null
    if (!reason) return NextResponse.json({ error: 'Reason required to unlock semester' }, { status: 400 })

    const updated = await prisma.semester.update({ where: { id }, data: { isLocked: false } })

    await createAudit(me.id, 'UNLOCK_SEMESTER', 'Semester', id, `Unlocked semester: ${reason}`)

    return NextResponse.json({ semester: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}