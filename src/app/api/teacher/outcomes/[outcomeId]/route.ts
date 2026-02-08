import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateOutcomeSchema } from '@/schemas/teacher/outcome.schema'
import { createAudit } from '@/lib/db/audit'

export async function PATCH(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { outcomeId } = params
    const co = await prisma.courseOutcome.findUnique({ where: { id: outcomeId } })
    if (!co) return NextResponse.json({ error: 'Course outcome not found' }, { status: 404 })

    const course = await prisma.course.findUnique({ where: { id: co.courseId }, include: { semester: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Prevent writes if semester is locked
    if (course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    // Check teacher assignment
    const assigned = await prisma.courseTeacher.findFirst({ where: { courseId: co.courseId, teacherId: me.id } })
    if (!assigned) return NextResponse.json({ error: 'Only assigned teacher can edit outcomes' }, { status: 403 })

    const body = await req.json()
    const parsed = updateOutcomeSchema.parse(body)

    const updated = await prisma.courseOutcome.update({ where: { id: outcomeId }, data: { description: parsed.description ?? co.description, bloomLevels: parsed.bloomLevels ?? co.bloomLevels } })

    await createAudit(me.id, 'UPDATE_COURSE_OUTCOME', 'CourseOutcome', outcomeId, `Updated CO ${co.code} for course ${co.courseId}`)

    return NextResponse.json({ courseOutcome: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
