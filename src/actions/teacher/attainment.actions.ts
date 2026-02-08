'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'
import { calcCOAttainment } from '@/lib/attainment-engine/co-calculator'
import { createAudit } from '@/lib/db/audit'

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

export async function getAttainmentResults(courseId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const config = await prisma.globalConfig.findFirst()
  if (!config) return { error: 'Global configuration not set. Contact admin.' }

  const cos = await prisma.courseOutcome.findMany({
    where: { courseId },
    include: {
      attainment: true,
      survey: true,
    },
    orderBy: { code: 'asc' },
  })

  const results = cos.map(co => ({
    id: co.id,
    code: co.code,
    description: co.description,
    bloomLevels: co.bloomLevels,
    attainment: co.attainment
      ? {
          ia1Level: co.attainment.ia1Level,
          ia2Level: co.attainment.ia2Level,
          endSemLevel: co.attainment.endSemLevel,
          directScore: co.attainment.directScore,
          indirectScore: co.attainment.indirectScore,
          finalScore: co.attainment.finalScore,
          level: co.attainment.level,
          calculatedAt: co.attainment.calculatedAt,
        }
      : null,
    survey: co.survey
      ? {
          responses: co.survey.responses,
          averageScore: co.survey.averageScore,
        }
      : null,
    target: config.coTargetPercent,
    targetLevel: config.poTargetLevel,
    achieved: co.attainment ? co.attainment.finalScore >= config.poTargetLevel : null,
  }))

  return {
    results,
    config: {
      coTargetPercent: config.coTargetPercent,
      directWeightage: config.directWeightage,
      indirectWeightage: config.indirectWeightage,
      ia1Weightage: config.ia1Weightage,
      ia2Weightage: config.ia2Weightage,
      endSemWeightage: config.endSemWeightage,
      poTargetLevel: config.poTargetLevel,
      level3Threshold: config.level3Threshold,
      level2Threshold: config.level2Threshold,
      level1Threshold: config.level1Threshold,
    },
  }
}

export async function recalculateAttainment(courseId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { semester: true },
  })
  if (!course) return { error: 'Course not found' }

  try {
    const results = await calcCOAttainment(courseId, course.semesterId)
    await createAudit(user.id, 'RECALCULATE', 'COAttainment', courseId, `Recalculated CO attainment for course ${courseId}`)
    return { success: true, results }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Calculation failed'
    return { error: message }
  }
}
