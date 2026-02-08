'use server'

import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'
import { createOutcomeSchema, updateOutcomeSchema } from '@/schemas/teacher/outcome.schema'

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

export async function getCourseOutcomes(courseId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const outcomes = await prisma.courseOutcome.findMany({
    where: { courseId },
    orderBy: { code: 'asc' },
  })
  return { outcomes }
}

export async function createCourseOutcome(courseId: string, data: { code: string; description: string; bloomLevels: string[] }) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)
  await checkSemesterLock(courseId)

  const parsed = createOutcomeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Validation failed' }

  // Check unique CO code per course
  const existing = await prisma.courseOutcome.findFirst({ where: { courseId, code: parsed.data.code } })
  if (existing) return { error: `CO code ${parsed.data.code} already exists for this course` }

  const outcome = await prisma.courseOutcome.create({
    data: { ...parsed.data, courseId },
  })

  await createAudit(user.id, 'CREATE', 'CourseOutcome', outcome.id, `Created ${outcome.code} for course ${courseId}`)
  return { outcome }
}

export async function updateCourseOutcome(courseId: string, outcomeId: string, data: { description?: string; bloomLevels?: string[] }) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)
  await checkSemesterLock(courseId)

  const parsed = updateOutcomeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Validation failed' }

  const outcome = await prisma.courseOutcome.update({
    where: { id: outcomeId },
    data: parsed.data,
  })

  await createAudit(user.id, 'UPDATE', 'CourseOutcome', outcome.id, `Updated ${outcome.code}`)
  return { outcome }
}

export async function deleteCourseOutcome(courseId: string, outcomeId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)
  await checkSemesterLock(courseId)

  // Check if questions are mapped to this CO
  const questions = await prisma.assessmentQuestion.findFirst({ where: { courseOutcomeId: outcomeId } })
  if (questions) return { error: 'Cannot delete CO: questions are already mapped to it' }

  // Check if marks exist via questions
  const marks = await prisma.studentMark.findFirst({
    where: { question: { courseOutcomeId: outcomeId } },
  })
  if (marks) return { error: 'Cannot delete CO: marks exist for mapped questions' }

  await prisma.courseOutcome.delete({ where: { id: outcomeId } })
  await createAudit(user.id, 'DELETE', 'CourseOutcome', outcomeId, `Deleted CO from course ${courseId}`)
  return { success: true }
}
