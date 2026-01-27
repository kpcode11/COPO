import { prisma } from '@/lib/db/prisma'

const LIKERT = ['STRONGLY_AGREE', 'AGREE', 'NEUTRAL', 'DISAGREE'] as const
export type Likert = typeof LIKERT[number]

export const validateCourseSurveyCsv = async (courseId: string, headers: string[], rows: Record<string, string>[]) => {
  const errors: string[] = []
  // Headers should exactly be course CO codes
  const cos = await prisma.courseOutcome.findMany({ where: { courseId } })
  const coCodes = cos.map((c: { code: string }) => c.code)

  // Check headers match
  if (headers.length === 0) return { valid: false, errors: ['No headers found'] }
  const missing = coCodes.filter((code: string) => !headers.includes(code))
  const extra = headers.filter((h: string) => !coCodes.includes(h))
  if (missing.length > 0) errors.push(`Missing CO columns: ${missing.join(', ')}`)
  if (extra.length > 0) errors.push(`Unexpected columns: ${extra.join(', ')}`)
  if (errors.length > 0) return { valid: false, errors }

  // Validate rows: each cell must be one of LIKERT options exactly
  const invalidOptions: Array<{ row: number; column: string; value: string }> = []
  rows.forEach((r: Record<string, string>, idx: number) => {
    headers.forEach((h: string) => {
      const val = (r[h] || '').toString().trim()
      if (!LIKERT.includes(val as Likert)) {
        invalidOptions.push({ row: idx + 1, column: h, value: val })
        errors.push(`Row ${idx + 1}, column ${h}: invalid option '${val}'`)
      }
    })
  })

  return { valid: errors.length === 0, errors, recordCount: rows.length, invalidOptions }
}

export const validateProgramSurveyCsv = async (programId: string, headers: string[], rows: Record<string, string>[]) => {
  const errors: string[] = []
  const pos = await prisma.programOutcome.findMany({ where: { programId } })
  const poCodes = pos.map((p: { code: string }) => p.code)

  if (headers.length === 0) return { valid: false, errors: ['No headers found'] }
  const missing = poCodes.filter((code: string) => !headers.includes(code))
  const extra = headers.filter((h: string) => !poCodes.includes(h))
  if (missing.length > 0) errors.push(`Missing PO columns: ${missing.join(', ')}`)
  if (extra.length > 0) errors.push(`Unexpected columns: ${extra.join(', ')}`)
  if (errors.length > 0) return { valid: false, errors }

  rows.forEach((r: Record<string, string>, idx: number) => {
    headers.forEach((h: string) => {
      const val = (r[h] || '').toString().trim()
      if (!LIKERT.includes(val as Likert)) {
        errors.push(`Row ${idx + 1}, column ${h}: invalid option '${val}'`)
      }
    })
  })

  return { valid: errors.length === 0, errors, recordCount: rows.length }
}

