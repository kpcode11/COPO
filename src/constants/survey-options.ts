// Likert scale options and scoring

export const SURVEY_OPTIONS = {
  STRONGLY_AGREE: { value: 'STRONGLY_AGREE', label: 'Strongly Agree', score: 4 },
  AGREE: { value: 'AGREE', label: 'Agree', score: 3 },
  NEUTRAL: { value: 'NEUTRAL', label: 'Neutral', score: 2 },
  DISAGREE: { value: 'DISAGREE', label: 'Disagree', score: 1 },
} as const

export const SURVEY_OPTIONS_LIST = [
  SURVEY_OPTIONS.STRONGLY_AGREE,
  SURVEY_OPTIONS.AGREE,
  SURVEY_OPTIONS.NEUTRAL,
  SURVEY_OPTIONS.DISAGREE,
]

export const SURVEY_TYPES = {
  COURSE: { value: 'COURSE', label: 'Course Exit Survey' },
  PROGRAM: { value: 'PROGRAM', label: 'Program Exit Survey' },
} as const

export function getSurveyScoreLabel(score: number): string {
  if (score >= 3.5) return 'Strongly Agree'
  if (score >= 2.5) return 'Agree'
  if (score >= 1.5) return 'Neutral'
  return 'Disagree'
}

export function getSurveyScoreVariant(score: number): 'success' | 'primary' | 'warning' | 'danger' {
  if (score >= 3.5) return 'success'
  if (score >= 2.5) return 'primary'
  if (score >= 1.5) return 'warning'
  return 'danger'
}
