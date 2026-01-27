import { z } from 'zod'

export const createOutcomeSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  bloomLevel: z.string().min(1),
})

export const updateOutcomeSchema = z.object({
  description: z.string().min(1).optional(),
  bloomLevel: z.string().min(1).optional(),
})
