import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const logoutSchema = z.object({
  // no body needed for logout; kept for compatibility
})

