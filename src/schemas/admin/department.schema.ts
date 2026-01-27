import { z } from 'zod'

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  isFirstYear: z.boolean().optional(),
})

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  isFirstYear: z.boolean().optional(),
})
