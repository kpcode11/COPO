import { z } from 'zod'

export const createMappingSchema = z.object({
  courseOutcomeId: z.string(),
  programOutcomeId: z.string(),
  value: z.number().int().min(0).max(3),
})

export const updateMappingSchema = z.object({
  value: z.number().int().min(0).max(3),
})
