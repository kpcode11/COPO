import { z } from 'zod'

const outcomeTemplate = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
})

export const createProgramSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string(),
  outcomeTemplates: z.array(outcomeTemplate).optional(),
})

export const updateProgramSchema = z.object({
  name: z.string().min(1).optional(),
  outcomeTemplates: z.array(outcomeTemplate).optional(),
})
