import { prisma } from '@/lib/db/prisma'

type ValidationError = {
  row: number
  column: string
  message: string
}

export const validateMarksRows = async (assessmentId: string, headers: string[], rows: Record<string, string>[]) => {
  const errors: ValidationError[] = []
  const preview: Record<string, string | number>[] = []

  // Validate headers: first must be RollNo
  if (headers.length === 0 || headers[0].toLowerCase() !== 'rollno') {
    errors.push({ row: 0, column: 'header', message: 'First column must be RollNo' })
    return { valid: false, errors, preview: [], recordCount: rows.length }
  }

  // Fetch questions for assessment
  const questions = await prisma.assessmentQuestion.findMany({ where: { assessmentId } })
  const questionMap = new Map(questions.map(q => [q.questionCode, q]))

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
    return { valid: false, errors, preview: [], recordCount: rows.length }
  }

  // Ensure file contains all question columns defined for the assessment
  const expectedQuestionCodes = questions.map(q => q.questionCode)
  const missingHeaders = expectedQuestionCodes.filter(code => !qHeaders.includes(code))
  if (missingHeaders.length > 0) {
    errors.push({ row: 0, column: 'header', message: `Missing question column(s): ${missingHeaders.join(', ')}` })
    return { valid: false, errors, preview: [], recordCount: rows.length }
  }

  // Validate mapping: each question must have a courseOutcomeId
  const unmapped = questions.filter(q => !q.courseOutcomeId).map(q => q.questionCode)
  if (unmapped.length > 0) {
    errors.push({ row: 0, column: 'mapping', message: `Unmapped questions: ${unmapped.join(', ')}` })
    return { valid: false, errors, preview: [], recordCount: rows.length }
  }

  // Validate rows
  rows.forEach((r, idx) => {
    const roll = r[headers[0]]?.toString().trim() || ''
    if (!roll) {
      errors.push({ row: idx + 1, column: headers[0], message: 'Missing RollNo' })
    }

    const previewRow: any = { RollNo: roll }

    qHeaders.forEach(qh => {
      const cell = r[qh]
      if (cell === undefined || cell === null || cell === '') {
        // treat as zero
        previewRow[qh] = 0
      } else {
        const val = Number(cell)
        if (Number.isNaN(val)) {
          errors.push({ row: idx + 1, column: qh, message: `Non-numeric value for ${qh}` })
          previewRow[qh] = cell
        } else {
          const q = questionMap.get(qh)!
          if (val > q.maxMarks) {
            errors.push({ row: idx + 1, column: qh, message: `Marks exceed max (${val} > ${q.maxMarks})` })
          }
          previewRow[qh] = val
        }
      }
    })

    if (Object.keys(previewRow).length > 0 && preview.length < 10) preview.push(previewRow)
  })

  const valid = errors.length === 0
  return { valid, errors, preview, recordCount: rows.length }
}

