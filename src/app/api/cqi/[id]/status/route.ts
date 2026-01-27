import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { prisma } from '@/lib/db/prisma'
import { updateCqiStatusSchema } from '@/schemas/teacher/cqi.schema'
import { isHod, isAdmin } from '@/lib/auth/rbac'
import { createAudit } from '@/lib/db/audit'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const action = await prisma.cQIAction.findUnique({ where: { id }, include: { courseOutcome: { include: { course: true } } } })
    if (!action) return NextResponse.json({ error: 'CQI action not found' }, { status: 404 })

    // Only HOD of course's department or Admin
    const deptId = action.courseOutcome.course.departmentId
    if (!(isAdmin(me) || (isHod(me) && me.departmentId === deptId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = updateCqiStatusSchema.parse(body)

    const updated = await prisma.cQIAction.update({ where: { id }, data: { status: parsed.status as any, reviewNotes: parsed.reviewNotes ?? null, reviewedBy: me.id, reviewedAt: new Date() } })

    await createAudit(me.id, 'REVIEW_CQI_ACTION', 'CQIAction', id, `Reviewed CQI action: ${parsed.status}`)

    return NextResponse.json({ action: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}