'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'

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

export async function getCoPoMappings(courseId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const mappings = await prisma.coPoMapping.findMany({
    where: { courseId },
    include: {
      courseOutcome: true,
      programOutcome: true,
    },
  })

  const cos = await prisma.courseOutcome.findMany({ where: { courseId }, orderBy: { code: 'asc' } })

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  const pos = course
    ? await prisma.programOutcome.findMany({ where: { programId: course.programId }, orderBy: { code: 'asc' } })
    : []

  return { mappings, cos, pos }
}

export async function getCourseOverview(courseId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      semester: {
        include: { academicYear: true },
      },
      department: true,
      program: true,
    },
  })
  if (!course) return { error: 'Course not found' }

  // Build progress checklist
  const cosCount = await prisma.courseOutcome.count({ where: { courseId } })
  const ia1 = await prisma.assessment.findFirst({ where: { courseId, type: 'IA1' } })
  const ia2 = await prisma.assessment.findFirst({ where: { courseId, type: 'IA2' } })
  const endSem = await prisma.assessment.findFirst({ where: { courseId, type: 'ENDSEM' } })

  const questionsCount = await prisma.assessmentQuestion.count({
    where: { assessment: { courseId } },
  })

  const marksCount = await prisma.marksUpload.count({
    where: { assessment: { courseId } },
  })

  const attainmentCount = await prisma.cOAttainment.count({
    where: { courseOutcome: { courseId } },
  })

  // Check if CQI actions needed and submitted
  const config = await prisma.globalConfig.findFirst()
  const targetLevel = config?.poTargetLevel ?? 2.5
  const belowTarget = await prisma.cOAttainment.count({
    where: { courseOutcome: { courseId }, finalScore: { lt: targetLevel } },
  })
  const cqiSubmitted = belowTarget > 0
    ? (await prisma.cQIAction.count({
        where: { courseOutcome: { courseId }, createdBy: user.id },
      })) >= belowTarget
    : true

  return {
    course,
    progress: {
      cosDefined: cosCount > 0,
      ia1Created: !!ia1,
      ia2Created: !!ia2,
      endSemCreated: !!endSem,
      questionsMapped: questionsCount > 0,
      marksUploaded: marksCount > 0,
      attainmentCalculated: attainmentCount > 0,
      actionTakenSubmitted: belowTarget === 0 || cqiSubmitted,
    },
  }
}

export async function getTeacherCourses() {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  const courseTeachers = await prisma.courseTeacher.findMany({
    where: { teacherId: user.id },
    include: {
      course: {
        include: {
          semester: {
            include: { academicYear: true },
          },
          department: true,
          program: true,
          _count: {
            select: { outcomes: true, assessments: true },
          },
        },
      },
    },
  })

  const courses = courseTeachers.map(ct => ct.course)
  return { courses }
}

export async function getTeacherCoursesByFilter(academicYearId?: string, semesterId?: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  const where: Record<string, unknown> = { teacherId: user.id }
  const courseWhere: Record<string, unknown> = {}

  if (semesterId) {
    courseWhere.semesterId = semesterId
  } else if (academicYearId) {
    courseWhere.semester = { academicYearId }
  }

  if (Object.keys(courseWhere).length > 0) {
    where.course = courseWhere
  }

  const courseTeachers = await prisma.courseTeacher.findMany({
    where,
    include: {
      course: {
        include: {
          semester: { include: { academicYear: true } },
          department: true,
          program: true,
          outcomes: true,
          assessments: {
            include: { marksUploads: { orderBy: { uploadedAt: 'desc' as const }, take: 1 } }
          },
        },
      },
    },
  })

  const courses = courseTeachers.map(ct => ({
    ...ct.course,
    _coCount: ct.course.outcomes.length,
    _assessmentCount: ct.course.assessments.length,
    _hasMarks: ct.course.assessments.some(a => a.marksUploads.length > 0),
  }))

  return { courses }
}

export async function getAcademicYearsAndSemesters() {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  const academicYears = await prisma.academicYear.findMany({
    include: { semesters: { orderBy: { number: 'asc' } } },
    orderBy: { name: 'desc' },
  })

  return { academicYears }
}
