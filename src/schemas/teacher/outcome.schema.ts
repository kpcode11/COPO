import { z } from 'zod'

export const createOutcomeSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  bloomLevels: z.array(z.string().min(1)).min(1, 'Select at least one Bloom level'),
})

export const updateOutcomeSchema = z.object({
  description: z.string().min(1).optional(),
  bloomLevels: z.array(z.string().min(1)).min(1, 'Select at least one Bloom level').optional(),
})
