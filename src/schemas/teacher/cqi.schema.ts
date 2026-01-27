import { z } from 'zod'

export const createCqiSchema = z.object({
  actionTaken: z.string().min(3),
  remarks: z.string().optional(),
})

export const updateCqiStatusSchema = z.object({
  status: z.enum(['REVIEWED', 'ACCEPTED', 'REJECTED']),
  reviewNotes: z.string().optional(),
})

