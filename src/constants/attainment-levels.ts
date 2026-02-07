// Attainment level definitions and colors

export const ATTAINMENT_LEVELS = {
  LEVEL_3: { value: 3, label: 'Level 3', color: 'success', description: 'High attainment' },
  LEVEL_2: { value: 2, label: 'Level 2', color: 'primary', description: 'Moderate attainment' },
  LEVEL_1: { value: 1, label: 'Level 1', color: 'warning', description: 'Low attainment' },
  LEVEL_0: { value: 0, label: 'Level 0', color: 'danger', description: 'Not attained' },
} as const

export type AttainmentLevelKey = keyof typeof ATTAINMENT_LEVELS

export const ATTAINMENT_LEVEL_LIST = [
  ATTAINMENT_LEVELS.LEVEL_3,
  ATTAINMENT_LEVELS.LEVEL_2,
  ATTAINMENT_LEVELS.LEVEL_1,
  ATTAINMENT_LEVELS.LEVEL_0,
]

export function getAttainmentBadgeVariant(level: string | number | null): 'success' | 'primary' | 'warning' | 'danger' | 'default' {
  if (level === null || level === undefined) return 'default'
  const numLevel = typeof level === 'string' ? parseInt(level.replace('LEVEL_', '')) : level
  if (numLevel >= 3) return 'success'
  if (numLevel >= 2) return 'primary'
  if (numLevel >= 1) return 'warning'
  return 'danger'
}

export function getAttainmentLabel(level: string | number | null): string {
  if (level === null || level === undefined) return 'N/A'
  const numLevel = typeof level === 'string' ? parseInt(level.replace('LEVEL_', '')) : level
  return `Level ${numLevel}`
}
