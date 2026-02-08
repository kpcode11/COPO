// TypeScript types for Surveys (Course Exit, Program Exit)

export interface COSurveyAggregate {
  id: string
  courseOutcomeId: string
  responses: number
  averageScore: number
}

export interface CourseSurveyUpload {
  id: string
  courseId: string
  fileName: string
  uploadedBy: string
  uploadedAt: string | Date
  recordCount: number
}
