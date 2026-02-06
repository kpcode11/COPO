/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Build initials from a full name (e.g. "John Doe" → "JD")
 */
export function getInitials(name: string | undefined | null, fallback = '?'): string {
  if (!name) return fallback
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format a role enum value for display (e.g. "HOD" → "HOD", "TEACHER" → "Teacher")
 */
export function formatRole(role: string): string {
  if (role === 'HOD') return 'HOD'
  return capitalize(role)
}

/**
 * Pluralize a word with a count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

/**
 * Sleep helper for async functions (ms)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Truncate a string to a max length, adding an ellipsis if needed
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}
