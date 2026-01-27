import { prisma } from '@/lib/db/prisma'
import { createAudit } from '@/lib/db/audit'

type CoursePO = {
  courseId: string
  courseName?: string
  courseCode?: string
  value: number
}

export const computeCourseLevelPO = async (programOutcomeId: string, courseId: string) => {
  // Get mappings for this course and PO
  const mappings = await prisma.coPoMapping.findMany({ where: { programOutcomeId, courseId } })
  if (!mappings || mappings.length === 0) return null

  // For each mapping, ensure CO attainment exists
  const coIds = mappings.map((m: { courseOutcomeId: string }) => m.courseOutcomeId)
  const coAttainments: any[] = await prisma.cOAttainment.findMany({ where: { courseOutcomeId: { in: coIds } } })
  const haveMap = new Map<string, any>(coAttainments.map((c: any) => [c.courseOutcomeId, c]))

  const missing = coIds.filter((id: string) => !haveMap.has(id))
  if (missing.length > 0) throw new Error(`Missing CO attainment for CO IDs: ${missing.join(', ')}`)

  let numerator = 0
  let denom = 0
  for (const m of mappings) {
    const ca = haveMap.get((m as any).courseOutcomeId)!
    numerator += ca.finalScore * (m as any).value
    denom += (m as any).value
  }

  if (denom === 0) return null
  const coursePO = numerator / denom
  return coursePO
}

export const recalcProgramPO = async (programId: string, semesterId: string, triggeredBy?: string) => {
  const program = await prisma.program.findUnique({ where: { id: programId }, include: { outcomes: true } })
  if (!program) throw new Error('Program not found')

  const config = await prisma.globalConfig.findFirst()
  if (!config) throw new Error('GlobalConfig not set')

  const results: Array<{ programOutcomeId: string; direct: number; indirect: number; final: number; courses: CoursePO[] }> = []

  for (const po of program.outcomes) {
    // Find mappings for this PO restricted to courses in semesterId
    const mappings = await prisma.coPoMapping.findMany({ where: { programOutcomeId: po.id }, include: { course: true } })
    const mappingsByCourse = new Map<string, typeof mappings>()
    for (const m of mappings) {
      if (m.course.semesterId !== semesterId) continue
      const arr = mappingsByCourse.get(m.courseId) ?? []
      arr.push(m)
      mappingsByCourse.set(m.courseId, arr)
    }

    const coursePOs: CoursePO[] = []
    for (const [courseId, ms] of Array.from(mappingsByCourse.entries())) {
      // compute using computeCourseLevelPO
      const value = await computeCourseLevelPO(po.id, courseId)
      if (value === null) continue
      const c = ms[0].course
      coursePOs.push({ courseId, courseName: c.name, courseCode: c.code, value })
    }

    if (coursePOs.length === 0) {
      // No contributing courses for this PO in the semester; skip
      continue
    }

    // Program direct = average of course-level PO values
    const direct = coursePOs.reduce((s, c) => s + c.value, 0) / coursePOs.length

    // Program indirect - from POSurveyAggregate
    const posAgg = await prisma.pOSurveyAggregate.findUnique({ where: { programOutcomeId: po.id } })
    const indirect = posAgg ? posAgg.averageScore : 0

    const final = direct * config.directWeightage + indirect * config.indirectWeightage

    // Upsert POAttainment
    await prisma.pOAttainment.upsert({ where: { programOutcomeId: po.id }, update: { directScore: direct, indirectScore: indirect, finalScore: final, calculatedAt: new Date() }, create: { programOutcomeId: po.id, directScore: direct, indirectScore: indirect, finalScore: final } })

    results.push({ programOutcomeId: po.id, direct, indirect, final, courses: coursePOs })
  }

let auditId: string | null = null
    if (triggeredBy) {
      const audit = await createAudit(triggeredBy, 'RECALC_PO_ATTAINMENT', 'Program', programId, `Recalculated PO attainment for program ${programId} semester ${semesterId}`)
      auditId = audit.id
    }

    return { results, auditId }
}
