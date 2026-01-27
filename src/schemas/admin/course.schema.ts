import { z } from 'zod'

export const createCourseSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  semesterId: z.string().min(1),
  departmentId: z.string().min(1),
  programId: z.string().min(1),
})

export const listCoursesQuerySchema = z.object({
  academicYearId: z.string().optional(),
  semesterId: z.string().optional(),
  departmentId: z.string().optional(),
  programId: z.string().optional(),
})

export const updateCourseSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  semesterId: z.string().optional(),
  departmentId: z.string().optional(),
  programId: z.string().optional(),
})
