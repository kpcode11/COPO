import { z } from 'zod'

export const updateConfigSchema = z.object({
  coTargetPercent: z.number().min(0).max(100).optional(),
  coTargetMarksPercent: z.number().min(0).max(100).optional(),
  ia1Weightage: z.number().min(0).max(1).optional(),
  ia2Weightage: z.number().min(0).max(1).optional(),
  endSemWeightage: z.number().min(0).max(1).optional(),
  directWeightage: z.number().min(0).max(1).optional(),
  indirectWeightage: z.number().min(0).max(1).optional(),
  poTargetLevel: z.number().min(0).optional(),
  level3Threshold: z.number().min(0).max(100).optional(),
  level2Threshold: z.number().min(0).max(100).optional(),
  level1Threshold: z.number().min(0).max(100).optional(),
})
