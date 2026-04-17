/**
 * Format a duration in milliseconds to a human-readable string.
 * Examples: 824354 → "13m 44s", 5000 → "5s", 456 → "456ms"
 */
export function formatDuration(ms) {
  if (ms == null || isNaN(ms)) return '—'
  const total = Math.round(ms)
  if (total < 1000) return `${total}ms`
  const seconds = Math.floor(total / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Format a duration in milliseconds to seconds with 1 decimal place.
 * Used for chart axes.
 */
export function formatDurationSeconds(ms) {
  if (ms == null || isNaN(ms)) return 0
  return Math.round(ms / 100) / 10
}
