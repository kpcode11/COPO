import { prisma } from '@/lib/db/prisma'

type ValidationError = {
  row: number
  column: string
  message: string
}

type InvalidMark = { row: number; column: string; value: string | number; message: string }

export const validateMarksRows = async (assessmentId: string, headers: string[], rows: Record<string, string>[]) => {
  const errors: ValidationError[] = []
  const invalidMarks: InvalidMark[] = []
  const preview: Record<string, string | number>[] = []

  // Validate headers: first must be RollNo
  if (headers.length === 0 || headers[0].toLowerCase() !== 'rollno') {
    errors.push({ row: 0, column: 'header', message: 'First column must be RollNo' })
    return { valid: false, errors, preview: [], recordCount: rows.length, summary: { missingQIDs: [], invalidMarks: [], unmappedQuestions: [] } }
  }

  // Fetch questions for assessment (select minimal fields to ensure types)
  const questions = await prisma.assessmentQuestion.findMany({ where: { assessmentId }, select: { id: true, questionCode: true, maxMarks: true, courseOutcomeId: true } })
  type Q = { id: string; questionCode: string; maxMarks: number; courseOutcomeId?: string | null }
  const questionMap = new Map<string, Q>(questions.map((q: Q) => [q.questionCode, q]))

  // Validate header question IDs
  const qHeaders = headers.slice(1)
  const unknownHeaders: string[] = []
  for (const qh of qHeaders) {
    if (!questionMap.has(qh)) {
      unknownHeaders.push(qh)
    }
  }
  if (unknownHeaders.length > 0) {
    errors.push({ row: 0, column: 'header', message: `Unknown question code(s) in file: ${unknownHeaders.join(', ')}` })
    return { valid: false, errors, preview: [], recordCount: rows.length, summary: { missingQIDs: unknownHeaders, invalidMarks: [], unmappedQuestions: [] } }
  }

  // Ensure file contains all question columns defined for the assessment
  const expectedQuestionCodes = questions.map((q: Q) => q.questionCode)
  const missingHeaders = expectedQuestionCodes.filter((code: string) => !qHeaders.includes(code))
  if (missingHeaders.length > 0) {
    errors.push({ row: 0, column: 'header', message: `Missing question column(s): ${missingHeaders.join(', ')}` })
    return { valid: false, errors, preview: [], recordCount: rows.length, summary: { missingQIDs: missingHeaders, invalidMarks: [], unmappedQuestions: [] } }
  }

  // Validate mapping: each question must have a courseOutcomeId
  const unmapped = questions.filter((q: Q) => !q.courseOutcomeId).map((q: Q) => q.questionCode)
  if (unmapped.length > 0) {
    errors.push({ row: 0, column: 'mapping', message: `Unmapped questions: ${unmapped.join(', ')}` })
    return { valid: false, errors, preview: [], recordCount: rows.length, summary: { missingQIDs: [], invalidMarks: [], unmappedQuestions: unmapped } }
  }

  // Validate rows
  rows.forEach((r: Record<string, string>, idx: number) => {
    const roll = r[headers[0]]?.toString().trim() || ''
    if (!roll) {
      errors.push({ row: idx + 1, column: headers[0], message: 'Missing RollNo' })
    }

    const previewRow: Record<string, string | number> = { RollNo: roll }

    qHeaders.forEach((qh: string) => {
      const cell = r[qh]
      if (cell === undefined || cell === null || cell === '') {
        // treat as zero
        previewRow[qh] = 0
      } else {
        const val = Number(cell)
        if (Number.isNaN(val)) {
          invalidMarks.push({ row: idx + 1, column: qh, value: cell, message: 'Non-numeric value' })
          previewRow[qh] = cell
        } else {
          const q = questionMap.get(qh) as Q
          if (val > q.maxMarks) {
            invalidMarks.push({ row: idx + 1, column: qh, value: val, message: `Marks exceed max (${val} > ${q.maxMarks})` })
          }
          previewRow[qh] = val
        }
      }
    })

    if (Object.keys(previewRow).length > 0 && preview.length < 10) preview.push(previewRow)
  })

  const valid = errors.length === 0 && invalidMarks.length === 0
  const summary = { missingQIDs: [], invalidMarks, unmappedQuestions: [] }
  return { valid, errors, preview, recordCount: rows.length, summary }
}

