// Default global config values

export const DEFAULT_CONFIG = {
  coTargetPercent: 60,
  coTargetMarksPercent: 60,
  directWeightage: 0.8,
  indirectWeightage: 0.2,
  ia1Weightage: 0.2,
  ia2Weightage: 0.2,
  endSemWeightage: 0.6,
  poTargetLevel: 2.5,
  level3Threshold: 60,
  level2Threshold: 50,
  level1Threshold: 40,
} as const

export const CONFIG_LABELS: Record<string, { label: string; description: string; unit: string; group: string }> = {
  coTargetPercent: { label: 'CO Target %', description: 'Percentage of students who must achieve the CO target marks', unit: '%', group: 'thresholds' },
  coTargetMarksPercent: { label: 'CO Target Marks %', description: 'Minimum marks percentage a student must score for a CO to be considered attained', unit: '%', group: 'thresholds' },
  directWeightage: { label: 'Direct Weightage', description: 'Weightage for direct assessment (IA + End Sem) in final attainment', unit: 'ratio', group: 'weightages' },
  indirectWeightage: { label: 'Indirect Weightage', description: 'Weightage for indirect assessment (surveys) in final attainment', unit: 'ratio', group: 'weightages' },
  ia1Weightage: { label: 'IA1 Weightage', description: 'Weightage of IA1 in direct assessment', unit: 'ratio', group: 'weightages' },
  ia2Weightage: { label: 'IA2 Weightage', description: 'Weightage of IA2 in direct assessment', unit: 'ratio', group: 'weightages' },
  endSemWeightage: { label: 'End Sem Weightage', description: 'Weightage of End Semester exam in direct assessment', unit: 'ratio', group: 'weightages' },
  poTargetLevel: { label: 'PO Target Level', description: 'Target attainment level for Program Outcomes (0-3 scale)', unit: 'level', group: 'thresholds' },
  level3Threshold: { label: 'Level 3 Threshold', description: 'Minimum CO attainment % for Level 3', unit: '%', group: 'thresholds' },
  level2Threshold: { label: 'Level 2 Threshold', description: 'Minimum CO attainment % for Level 2', unit: '%', group: 'thresholds' },
  level1Threshold: { label: 'Level 1 Threshold', description: 'Minimum CO attainment % for Level 1', unit: '%', group: 'thresholds' },
}

export type ConfigKey = keyof typeof DEFAULT_CONFIG
