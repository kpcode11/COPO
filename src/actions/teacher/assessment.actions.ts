'use server'

import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'
import { createAssessmentSchema } from '@/schemas/teacher/assessment.schema'

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

export async function getAssessments(courseId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const assessments = await prisma.assessment.findMany({
    where: { courseId },
    include: {
      questions: { include: { courseOutcome: true }, orderBy: { questionCode: 'asc' } },
      marksUploads: { orderBy: { uploadedAt: 'desc' }, take: 1 },
    },
    orderBy: { type: 'asc' },
  })
  return { assessments }
}

export async function createAssessment(courseId: string, data: { type: string; date: string; totalMarks: number }) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)
  await checkSemesterLock(courseId)

  const parsed = createAssessmentSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Validation failed' }

  // Only one assessment per type per course
  const existing = await prisma.assessment.findFirst({ where: { courseId, type: parsed.data.type } })
  if (existing) return { error: `An assessment of type ${parsed.data.type} already exists for this course` }

  const assessment = await prisma.assessment.create({
    data: {
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      totalMarks: parsed.data.totalMarks,
      courseId,
    },
  })

  await createAudit(user.id, 'CREATE', 'Assessment', assessment.id, `Created ${assessment.type} for course ${courseId}`)
  return { assessment }
}

export async function updateAssessment(courseId: string, assessmentId: string, data: { date?: string; totalMarks?: number }) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)
  await checkSemesterLock(courseId)

  const updateData: Record<string, unknown> = {}
  if (data.date) updateData.date = new Date(data.date)
  if (data.totalMarks !== undefined) {
    if (data.totalMarks <= 0) return { error: 'Total marks must be positive' }
    updateData.totalMarks = data.totalMarks
  }

  const assessment = await prisma.assessment.update({
    where: { id: assessmentId },
    data: updateData,
  })

  await createAudit(user.id, 'UPDATE', 'Assessment', assessment.id, `Updated ${assessment.type}`)
  return { assessment }
}

export async function deleteAssessment(courseId: string, assessmentId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)
  await checkSemesterLock(courseId)

  // Check for existing marks
  const marks = await prisma.studentMark.findFirst({
    where: { question: { assessmentId } },
  })
  if (marks) return { error: 'Cannot delete assessment: marks already uploaded' }

  // Delete questions first, then assessment
  await prisma.assessmentQuestion.deleteMany({ where: { assessmentId } })
  await prisma.assessment.delete({ where: { id: assessmentId } })

  await createAudit(user.id, 'DELETE', 'Assessment', assessmentId, `Deleted assessment from course ${courseId}`)
  return { success: true }
}
