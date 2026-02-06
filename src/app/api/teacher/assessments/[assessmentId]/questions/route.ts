import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createQuestionSchema } from '@/schemas/teacher/assessment.schema'
import { createAudit } from '@/lib/db/audit'

export async function POST(req: Request, context: any) {
  try {
    const ctx: any = context;
    let params = ctx.params;
    if (params instanceof Promise) params = await params;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { assessmentId } = params
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, include: { course: { include: { semester: true } } } })
    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

    // Prevent writes if semester is locked
    if (assessment.course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    // Check teacher assignment
    const assigned = await prisma.courseTeacher.findFirst({ where: { courseId: assessment.course.id, teacherId: me.id } })
    if (!assigned) return NextResponse.json({ error: 'Only assigned teacher can create questions' }, { status: 403 })

    const body = await req.json()
    const parsed = createQuestionSchema.parse(body)

    // Ensure questionCode unique per assessment
    const exists = await prisma.assessmentQuestion.findFirst({ where: { assessmentId, questionCode: parsed.questionCode } })
    if (exists) return NextResponse.json({ error: 'Question code must be unique per assessment' }, { status: 400 })

    // Ensure courseOutcome exists and belongs to same course
    const co = await prisma.courseOutcome.findUnique({ where: { id: parsed.courseOutcomeId } })
    if (!co || co.courseId !== assessment.course.id) return NextResponse.json({ error: 'CourseOutcome not found for this course' }, { status: 400 })

    const question = await prisma.assessmentQuestion.create({ data: { questionCode: parsed.questionCode, maxMarks: parsed.maxMarks, assessmentId, courseOutcomeId: parsed.courseOutcomeId } })

    await createAudit(me.id, 'CREATE_QUESTION', 'AssessmentQuestion', question.id, `Created question ${question.questionCode} for assessment ${assessmentId}`)

    return NextResponse.json({ question })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
