import { z } from 'zod'

export const createCqiSchema = z.object({
  courseOutcomeId: z.string().min(1, 'CO is required'),
  issueAnalysis: z.string().min(3, 'Issue analysis is required'),
  actionTaken: z.string().min(3, 'Action taken is required'),
  proposedImprovement: z.string().min(3, 'Proposed improvement is required'),
  status: z.enum(['PLANNED', 'IMPLEMENTED', 'VERIFIED']).default('PLANNED'),
  remarks: z.string().optional(),
})

export const updateCqiSchema = z.object({
  issueAnalysis: z.string().min(3).optional(),
  actionTaken: z.string().min(3).optional(),
  proposedImprovement: z.string().min(3).optional(),
  status: z.enum(['PLANNED', 'IMPLEMENTED', 'VERIFIED']).optional(),
  remarks: z.string().optional(),
})

export const updateCqiStatusSchema = z.object({
  status: z.enum(['REVIEWED', 'ACCEPTED', 'REJECTED']),
  reviewNotes: z.string().optional(),
})

