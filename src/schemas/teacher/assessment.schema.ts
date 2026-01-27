import { z } from 'zod'

export const createAssessmentSchema = z.object({
  type: z.enum(['IA1', 'IA2', 'ENDSEM']),
  date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }),
  totalMarks: z.number().int().positive(),
})

export const createQuestionSchema = z.object({
  questionCode: z.string().min(1),
  maxMarks: z.number().int().positive(),
  courseOutcomeId: z.string().min(1),
})

export const updateQuestionSchema = z.object({
  questionCode: z.string().min(1).optional(),
  maxMarks: z.number().int().positive().optional(),
  courseOutcomeId: z.string().min(1).optional(),
})
