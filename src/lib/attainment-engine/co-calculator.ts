import { prisma } from '@/lib/db/prisma'
import { resolveLevelFromPercent, resolveLevelFromFinalScore } from './level-resolver'

// Local minimal types — avoid depending on generated Prisma client types to keep TS happy before codegen runs
type SimpleAssessmentQuestion = { id: string; maxMarks: number }
type SimpleStudentMark = { questionId: string; rollNo: string; marks: number }

export const computeAssessmentCOPercent = async (assessmentId: string, coId: string, coTargetMarksPercent: number): Promise<number | null> => {
  // Get questions for this assessment mapped to the CO
  const questions: SimpleAssessmentQuestion[] = await prisma.assessmentQuestion.findMany({ where: { assessmentId, courseOutcomeId: coId }, select: { id: true, maxMarks: true } })
  if (!questions || questions.length === 0) return null

  // Get latest marks upload for the assessment
  const latestUpload = await prisma.marksUpload.findFirst({ where: { assessmentId }, orderBy: { uploadedAt: 'desc' } })
  if (!latestUpload) return 0

  const marks: SimpleStudentMark[] = await prisma.studentMark.findMany({ where: { marksUploadId: latestUpload.id, questionId: { in: questions.map((q) => q.id) } }, select: { questionId: true, rollNo: true, marks: true } })
  if (!marks || marks.length === 0) return 0

  // Group by rollNo
  const byStudent = new Map<string, { obtained: number; max: number }>()
  for (const q of questions) {
    const qMarks = marks.filter((m: SimpleStudentMark) => m.questionId === q.id)
    for (const m of qMarks) {
      const s = byStudent.get(m.rollNo) ?? { obtained: 0, max: 0 }
      s.obtained += m.marks
      s.max += q.maxMarks
      byStudent.set(m.rollNo, s)
    }
  }

  const totalStudents = byStudent.size
  if (totalStudents === 0) return 0

  const thresholdRatio = coTargetMarksPercent / 100
  let successCount = 0
  Array.from(byStudent.values()).forEach(v => {
    if (v.max === 0) return
    if (v.obtained >= v.max * thresholdRatio) successCount++
  })

  return (successCount / totalStudents) * 100
}

export const computeAssessmentTypePercentForCO = async (courseId: string, coId: string, type: 'IA1' | 'IA2' | 'ENDSEM', coTargetMarksPercent: number) => {
  const assessments = await prisma.assessment.findMany({ where: { courseId, type } })
  if (!assessments || assessments.length === 0) return null

  const percents: number[] = []
  for (const a of assessments) {
    const p = await computeAssessmentCOPercent(a.id, coId, coTargetMarksPercent)
    if (p !== null) percents.push(p)
  }
  if (percents.length === 0) return null
  const avg = percents.reduce((s, v) => s + v, 0) / percents.length
  return avg
}

export const calcCOAttainment = async (courseId: string, semesterId: string) => {
  // Fetch global config
  const config = await prisma.globalConfig.findFirst()
  if (!config) throw new Error('GlobalConfig not set')

  const cos = await prisma.courseOutcome.findMany({ where: { courseId }, include: { course: true } })

  const results = []
  for (const co of cos) {
    const ia1Percent = await computeAssessmentTypePercentForCO(courseId, co.id, 'IA1', config.coTargetMarksPercent)
    const ia2Percent = await computeAssessmentTypePercentForCO(courseId, co.id, 'IA2', config.coTargetMarksPercent)
    const endSemPercent = await computeAssessmentTypePercentForCO(courseId, co.id, 'ENDSEM', config.coTargetMarksPercent)

    const ia1Level = ia1Percent === null ? null : resolveLevelFromPercent(ia1Percent, config)
    const ia2Level = ia2Percent === null ? null : resolveLevelFromPercent(ia2Percent, config)
    const endSemLevel = endSemPercent === null ? null : resolveLevelFromPercent(endSemPercent, config)

    // Convert levels to numeric (LEVEL_0 -> 0 ... LEVEL_3 -> 3)
    const levelToNum = (lvl: string | null) => {
      if (lvl === 'LEVEL_3') return 3
      if (lvl === 'LEVEL_2') return 2
      if (lvl === 'LEVEL_1') return 1
      return 0
    }

    const ia1Num = ia1Level ? levelToNum(ia1Level) : 0
    const ia2Num = ia2Level ? levelToNum(ia2Level) : 0
    const endNum = endSemLevel ? levelToNum(endSemLevel) : 0

    const directScore = ia1Num * config.ia1Weightage + ia2Num * config.ia2Weightage + endNum * config.endSemWeightage

    // Indirect CO - from survey aggregate averageScore (0..3)
    const survey = await prisma.cOSurveyAggregate.findUnique({ where: { courseOutcomeId: co.id } })
    const indirectScore = survey ? survey.averageScore : 0

    const finalScore = directScore * config.directWeightage + indirectScore * config.indirectWeightage

    const level = resolveLevelFromFinalScore(finalScore, { poTargetLevel: config.poTargetLevel })

    results.push({ coId: co.id, ia1Level, ia2Level, endSemLevel, directScore, indirectScore, finalScore, level })

    // Upsert COAttainment
    await prisma.cOAttainment.upsert({ where: { courseOutcomeId: co.id }, update: { ia1Level: ia1Num, ia2Level: ia2Num, endSemLevel: endNum, directScore, indirectScore, finalScore, level: level as any, calculatedAt: new Date() }, create: { courseOutcomeId: co.id, ia1Level: ia1Num, ia2Level: ia2Num, endSemLevel: endNum, directScore, indirectScore, finalScore, level: level as any } })
  }

  return results
}

