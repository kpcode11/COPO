import { z } from 'zod'

// ── Academic Years ──────────────────────────────────────────────────────────────

export const createAcademicYearSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(/^\d{4}-\d{2}$/, 'Name must be in format YYYY-YY (e.g. 2024-25)'),
  isActive: z.boolean().optional().default(false),
})

export const updateAcademicYearSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^\d{4}-\d{2}$/, 'Name must be in format YYYY-YY')
    .optional(),
  isActive: z.boolean().optional(),
})

// ── Semesters ───────────────────────────────────────────────────────────────────

export const createSemesterSchema = z.object({
  number: z.coerce
    .number()
    .int()
    .min(1, 'Semester number must be between 1 and 8')
    .max(8, 'Semester number must be between 1 and 8'),
  academicYearId: z.string().min(1, 'Academic year is required'),
})

export const updateSemesterSchema = z.object({
  number: z.coerce
    .number()
    .int()
    .min(1)
    .max(8)
    .optional(),
  isLocked: z.boolean().optional(),
})

/** Derive ODD/EVEN from semester number */
export function semesterTypeFromNumber(n: number): 'ODD' | 'EVEN' {
  return n % 2 === 1 ? 'ODD' : 'EVEN'
}
