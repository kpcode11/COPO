import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createAssessmentSchema } from '@/schemas/teacher/assessment.schema'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { courseId } = params
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { semester: true } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // Prevent writes if semester is locked
    if (course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    // Check teacher assignment
    const assigned = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: me.id } })
    if (!assigned) return NextResponse.json({ error: 'Only assigned teacher can create assessments' }, { status: 403 })

    const body = await req.json()
    const parsed = createAssessmentSchema.parse(body)

    const assessment = await prisma.assessment.create({ data: { type: parsed.type, date: new Date(parsed.date), totalMarks: parsed.totalMarks, courseId } })

    await createAudit(me.id, 'CREATE_ASSESSMENT', 'Assessment', assessment.id, `Created assessment ${parsed.type} for course ${courseId}`)

    return NextResponse.json({ assessment })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
