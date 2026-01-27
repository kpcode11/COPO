import { z } from 'zod'

export const assignTeacherSchema = z.object({
  teacherId: z.string().min(1),
})
