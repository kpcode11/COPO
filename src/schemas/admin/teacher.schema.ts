import { z } from 'zod'

export const createTeacherSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  departmentId: z.string().min(1),
})
