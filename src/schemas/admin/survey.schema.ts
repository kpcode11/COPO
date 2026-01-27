import { z } from 'zod'

const templateQuestion = z.object({
  code: z.string().min(1), // CO1 or PO1
  text: z.string().optional(),
})

export const createCourseSurveyTemplateSchema = z.object({
  questions: z.array(templateQuestion).min(1),
})

export const createProgramSurveyTemplateSchema = z.object({
  questions: z.array(templateQuestion).min(1),
})
