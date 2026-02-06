export type AttainmentLevel = 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'

export interface COAttainment {
  id: string
  courseOutcomeId: string
  ia1Level: number | null
  ia2Level: number | null
  endSemLevel: number | null
  directScore: number
  indirectScore: number
  finalScore: number
  level: AttainmentLevel
  calculatedAt: string | Date
}

export interface POAttainment {
  id: string
  programOutcomeId: string
  directScore: number
  indirectScore: number
  finalScore: number
  calculatedAt: string | Date
}
