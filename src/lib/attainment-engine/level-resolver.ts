// Lightweight types to avoid importing Prisma model types in this module
export type LevelThresholds = {
  level3Threshold?: number
  level2Threshold?: number
  level1Threshold?: number
  poTargetLevel?: number
}

export const resolveLevelFromPercent = (percent: number, config: LevelThresholds) => {
  if (percent >= (config.level3Threshold ?? 60)) return 'LEVEL_3'
  if (percent >= (config.level2Threshold ?? 50)) return 'LEVEL_2'
  if (percent >= (config.level1Threshold ?? 40)) return 'LEVEL_1'
  return 'LEVEL_0'
}

export const resolveLevelFromFinalScore = (score: number, config?: LevelThresholds) => {
  // Default target 2.5
  const target = config?.poTargetLevel ?? 2.5
  if (score >= target) return 'LEVEL_3'
  if (score >= target - 0.5) return 'LEVEL_2'
  if (score >= target - 1.5) return 'LEVEL_1'
  return 'LEVEL_0'
} 

