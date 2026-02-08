// TypeScript types for Reports

export type CqiStatus = 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'

export interface CQIAction {
  id: string
  courseOutcomeId: string
  issueAnalysis?: string
  actionTaken: string
  proposedImprovement?: string
  remarks?: string
  status: CqiStatus
  createdBy: string
  createdAt: string | Date
  reviewedBy?: string
  reviewNotes?: string
  reviewedAt?: string | Date
  courseOutcome?: {
    id: string
    code: string
    description: string
  }
}

export interface CourseProgress {
  cosDefinied: boolean
  ia1Created: boolean
  ia2Created: boolean
  endSemCreated: boolean
  questionsMapped: boolean
  marksUploaded: boolean
  attainmentCalculated: boolean
  actionTakenSubmitted: boolean
}

export interface CourseOverview {
  course: {
    id: string
    code: string
    name: string
    semester: {
      id: string
      number: number
      type: string
      isLocked: boolean
      academicYear: {
        id: string
        name: string
      }
    }
  }
  progress: CourseProgress
}
