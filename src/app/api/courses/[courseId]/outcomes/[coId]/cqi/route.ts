import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { prisma } from '@/lib/db/prisma'
import { createCqiSchema } from '@/schemas/teacher/cqi.schema'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { courseId, coId } = params
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { semester: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    if (course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    // Check teacher assignment
    const assigned = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: me.id } })
    if (!assigned) return NextResponse.json({ error: 'Only assigned teacher can create CQI actions' }, { status: 403 })

    const body = await req.json()
    const parsed = createCqiSchema.parse(body)

    // Ensure CO exists and belongs to the course
    const co = await prisma.courseOutcome.findUnique({ where: { id: coId } })
    if (!co || co.courseId !== courseId) return NextResponse.json({ error: 'CO not found for this course' }, { status: 404 })

    const action = await prisma.cQIAction.create({ data: { courseOutcomeId: coId, actionTaken: parsed.actionTaken, remarks: parsed.remarks ?? null, createdBy: me.id } })

    await createAudit(me.id, 'CREATE_CQI_ACTION', 'CQIAction', action.id, `Created CQI action for CO ${coId}`)

    return NextResponse.json({ action })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}