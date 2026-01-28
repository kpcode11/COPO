import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { updateQuestionSchema } from '@/schemas/teacher/assessment.schema'
import { createAudit } from '@/lib/db/audit'

export async function PATCH(req: Request, context: any) {
  try {
    const { params } = context as any;
    const me = await getCurrentUser(req)
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { questionId } = params
    const question = await prisma.assessmentQuestion.findUnique({ where: { id: questionId }, include: { assessment: { include: { course: { include: { semester: true } } } } } })
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

    // Prevent writes if semester is locked
    if (question.assessment.course.semester.isLocked) return NextResponse.json({ error: 'Semester is locked' }, { status: 403 })

    // Check teacher assignment
    const assigned = await prisma.courseTeacher.findFirst({ where: { courseId: question.assessment.course.id, teacherId: me.id } })
    if (!assigned) return NextResponse.json({ error: 'Only assigned teacher can update questions' }, { status: 403 })

    const body = await req.json()
    const parsed = updateQuestionSchema.parse(body)

    // If remapping, ensure new CO belongs to same course
    if (parsed.courseOutcomeId) {
      const co = await prisma.courseOutcome.findUnique({ where: { id: parsed.courseOutcomeId } })
      if (!co || co.courseId !== question.assessment.course.id) return NextResponse.json({ error: 'CourseOutcome not found for this course' }, { status: 400 })
    }

    // If changing questionCode, ensure uniqueness in assessment
    if (parsed.questionCode && parsed.questionCode !== question.questionCode) {
      const exists = await prisma.assessmentQuestion.findFirst({ where: { assessmentId: question.assessmentId, questionCode: parsed.questionCode } })
      if (exists) return NextResponse.json({ error: 'Question code must be unique per assessment' }, { status: 400 })
    }

    const updated = await prisma.assessmentQuestion.update({ where: { id: questionId }, data: { questionCode: parsed.questionCode ?? question.questionCode, maxMarks: parsed.maxMarks ?? question.maxMarks, courseOutcomeId: parsed.courseOutcomeId ?? question.courseOutcomeId } })

    await createAudit(me.id, 'UPDATE_QUESTION', 'AssessmentQuestion', questionId, `Updated question ${updated.questionCode}`)

    return NextResponse.json({ question: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 })
  }
}
