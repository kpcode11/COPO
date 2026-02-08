'use server'

import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'
import { createCqiSchema, updateCqiSchema } from '@/schemas/teacher/cqi.schema'

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

export async function getCqiActions(courseId: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const cos = await prisma.courseOutcome.findMany({
    where: { courseId },
    include: {
      attainment: true,
      cqiActions: {
        where: { createdBy: user.id },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { code: 'asc' },
  })

  const config = await prisma.globalConfig.findFirst()
  const targetLevel = config?.poTargetLevel ?? 2.5

  // Only COs that have attainment calculated and are below target
  const actionItems = cos
    .filter(co => co.attainment && co.attainment.finalScore < targetLevel)
    .map(co => ({
      co: {
        id: co.id,
        code: co.code,
        description: co.description,
        finalScore: co.attainment!.finalScore,
        targetLevel,
        gap: targetLevel - co.attainment!.finalScore,
      },
      existingAction: co.cqiActions[0] || null,
    }))

  return { actionItems, targetLevel }
}

export async function createCqiAction(
  courseId: string,
  data: {
    courseOutcomeId: string
    issueAnalysis: string
    actionTaken: string
    proposedImprovement: string
    status?: string
    remarks?: string
  }
) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const parsed = createCqiSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Validation failed' }

  // Verify CO belongs to course
  const co = await prisma.courseOutcome.findFirst({
    where: { id: parsed.data.courseOutcomeId, courseId },
  })
  if (!co) return { error: 'Course outcome not found for this course' }

  const cqi = await prisma.cQIAction.create({
    data: {
      courseOutcomeId: parsed.data.courseOutcomeId,
      actionTaken: parsed.data.actionTaken,
      remarks: [
        `Issue: ${parsed.data.issueAnalysis}`,
        `Improvement: ${parsed.data.proposedImprovement}`,
        parsed.data.remarks ? `Notes: ${parsed.data.remarks}` : '',
      ].filter(Boolean).join('\n'),
      createdBy: user.id,
      status: 'PENDING',
    },
  })

  await createAudit(user.id, 'CREATE', 'CQIAction', cqi.id, `Created CQI action for ${co.code} in course ${courseId}`)
  return { cqi }
}

export async function updateCqiAction(
  courseId: string,
  cqiId: string,
  data: {
    issueAnalysis?: string
    actionTaken?: string
    proposedImprovement?: string
    status?: string
    remarks?: string
  }
) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  await verifyCourseOwnership(user.id, courseId)

  const parsed = updateCqiSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Validation failed' }

  // Verify CQI belongs to this teacher
  const existing = await prisma.cQIAction.findUnique({ where: { id: cqiId } })
  if (!existing) return { error: 'CQI action not found' }
  if (existing.createdBy !== user.id) return { error: 'You can only edit your own CQI actions' }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.actionTaken) updateData.actionTaken = parsed.data.actionTaken
  if (parsed.data.issueAnalysis || parsed.data.proposedImprovement || parsed.data.remarks) {
    updateData.remarks = [
      parsed.data.issueAnalysis ? `Issue: ${parsed.data.issueAnalysis}` : '',
      parsed.data.proposedImprovement ? `Improvement: ${parsed.data.proposedImprovement}` : '',
      parsed.data.remarks ? `Notes: ${parsed.data.remarks}` : '',
    ].filter(Boolean).join('\n')
  }

  const cqi = await prisma.cQIAction.update({
    where: { id: cqiId },
    data: updateData,
  })

  await createAudit(user.id, 'UPDATE', 'CQIAction', cqi.id, `Updated CQI action`)
  return { cqi }
}
