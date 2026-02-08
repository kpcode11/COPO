'use server'

import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'
import { createQuestionSchema } from '@/schemas/teacher/assessment.schema'

async function getUser() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const req = new Request('http://localhost', { headers: { cookie: cookieHeader } })
  return getCurrentUser(req)
}

async function verifyCourseOwnership(userId: string, courseId: string) {
  const ct = await prisma.courseTeacher.findFirst({ where: { courseId, teacherId: userId } })
  if (!ct) throw new Error('You are not assigned to this course')
  return ct
}

async function checkSemesterLock(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, include: { semester: true } })
  if (!course) throw new Error('Course not found')
  if (course.semester.isLocked) throw new Error('Semester is locked. Cannot modify data.')
  return course
}

export async function getQuestions(assessmentId: string, courseId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const questions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    include: { courseOutcome: true },
    orderBy: { questionCode: 'asc' },
  })
  return { questions }
}

export async function saveQuestions(
  courseId: string,
  assessmentId: string,
  questions: { questionCode: string; maxMarks: number; courseOutcomeId: string }[]
) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)
  await checkSemesterLock(courseId)

  // Validate each question
  for (const q of questions) {
    const parsed = createQuestionSchema.safeParse(q)
    if (!parsed.success) return { error: `${q.questionCode}: ${parsed.error.issues[0]?.message}` }
  }

  // Verify assessment belongs to course
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, courseId } })
  if (!assessment) return { error: 'Assessment not found for this course' }

  // Warn if sum of maxMarks != totalMarks
  const sumMarks = questions.reduce((s, q) => s + q.maxMarks, 0)
  if (sumMarks !== assessment.totalMarks) {
    return { error: `Sum of question marks (${sumMarks}) does not equal assessment total marks (${assessment.totalMarks})` }
  }

  // Check for duplicate question codes
  const codes = questions.map(q => q.questionCode)
  const uniqueCodes = new Set(codes)
  if (uniqueCodes.size !== codes.length) {
    return { error: 'Duplicate question codes found' }
  }

  // Verify all COs belong to this course
  const coIds = [...new Set(questions.map(q => q.courseOutcomeId))]
  const cos = await prisma.courseOutcome.findMany({ where: { id: { in: coIds }, courseId } })
  if (cos.length !== coIds.length) {
    return { error: 'Some course outcomes do not belong to this course' }
  }

  // Check if marks exist for existing questions — if so, block
  const existingMarks = await prisma.studentMark.findFirst({
    where: { question: { assessmentId } },
  })
  if (existingMarks) {
    return { error: 'Cannot modify questions after marks have been uploaded. Delete marks first.' }
  }

  // Transaction: delete old questions, create new ones
  await prisma.$transaction(async (tx) => {
    await tx.assessmentQuestion.deleteMany({ where: { assessmentId } })
    await tx.assessmentQuestion.createMany({
      data: questions.map(q => ({
        questionCode: q.questionCode,
        maxMarks: q.maxMarks,
        courseOutcomeId: q.courseOutcomeId,
        assessmentId,
      })),
    })
  })

  await createAudit(user.id, 'UPDATE', 'AssessmentQuestion', assessmentId, `Saved ${questions.length} questions`)

  const savedQuestions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    include: { courseOutcome: true },
    orderBy: { questionCode: 'asc' },
  })
  return { questions: savedQuestions }
}
