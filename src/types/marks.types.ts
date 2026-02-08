// TypeScript types for Marks upload, validation

export interface StudentMarkRecord {
  rollNo: string
  questionId: string
  marks: number
}

export interface MarksUploadResult {
  success: boolean
  uploadId?: string
  recordCount: number
  errors: MarksValidationError[]
}

export interface MarksValidationError {
  row: number
  column: string
  message: string
  value?: string | number
}

export interface MarksPreviewRow {
  RollNo: string
  [questionCode: string]: string | number
}

export interface MarksValidationResult {
  valid: boolean
  errors: MarksValidationError[]
  preview: MarksPreviewRow[]
  recordCount: number
  summary: {
    missingQIDs: string[]
    invalidMarks: { row: number; column: string; value: string | number; message: string }[]
    unmappedQuestions: string[]
  }
}

export interface MarksUploadInfo {
  id: string
  assessmentId: string
  fileName: string
  uploadedBy: string
  uploadedAt: string | Date
  recordCount: number
}
