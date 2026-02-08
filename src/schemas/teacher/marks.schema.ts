import { z } from 'zod'

export const marksUploadSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
})

export const marksRowSchema = z.object({
  rollNo: z.string().min(1),
  marks: z.record(z.string(), z.number().min(0)),
})
