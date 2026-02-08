// Bloom's taxonomy levels

export const BLOOM_LEVELS = [
  { value: 'Remember', label: 'Remember (L1)', description: 'Recall facts and basic concepts' },
  { value: 'Understand', label: 'Understand (L2)', description: 'Explain ideas or concepts' },
  { value: 'Apply', label: 'Apply (L3)', description: 'Use information in new situations' },
  { value: 'Analyze', label: 'Analyze (L4)', description: 'Draw connections among ideas' },
  { value: 'Evaluate', label: 'Evaluate (L5)', description: 'Justify a stand or decision' },
  { value: 'Create', label: 'Create (L6)', description: 'Produce new or original work' },
] as const

export type BloomLevel = typeof BLOOM_LEVELS[number]['value']

export const getBloomLabel = (value: string): string => {
  const level = BLOOM_LEVELS.find(l => l.value === value)
  return level?.label ?? value
}

export const getBloomLabels = (values: string[]): string[] =>
  values.map(v => getBloomLabel(v))

export const getBloomOptions = () =>
  BLOOM_LEVELS.map(l => ({ value: l.value, label: l.label }))
