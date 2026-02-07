import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'HOD', 'TEACHER']),
  departmentId: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  departmentId: z.string().optional(),
  role: z.enum(['ADMIN', 'HOD', 'TEACHER']).optional(),
  isActive: z.boolean().optional(),
})

