export type AssessmentType = 'IA1' | 'IA2' | 'ENDSEM'

export interface CourseOutcome {
  id: string
  code: string
  description: string
  bloomLevels: string[]
  courseId: string
}

export interface CoPoMapping {
  id: string
  courseId: string
  courseOutcomeId: string
  programOutcomeId: string
  value: number
}

export interface Assessment {
  id: string
  type: AssessmentType
  totalMarks: number
  date: string | Date
  courseId: string
}

export interface AssessmentQuestion {
  id: string
  questionCode: string
  maxMarks: number
  assessmentId: string
  courseOutcomeId: string
}
