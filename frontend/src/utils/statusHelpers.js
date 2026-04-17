/**
 * Status display helpers — colors, icons, and labels for test statuses.
 */

export function getStatusColor(status) {
  switch (status) {
    case 'passed':  return 'text-green-600 dark:text-green-400'
    case 'failed':  return 'text-red-600 dark:text-red-400'
    case 'flaky':   return 'text-yellow-600 dark:text-yellow-400'
    case 'skipped': return 'text-gray-500 dark:text-gray-400'
    default:        return 'text-gray-500 dark:text-gray-400'
  }
}

export function getStatusBgColor(status) {
  switch (status) {
    case 'passed':  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'failed':  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'flaky':   return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'skipped': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    default:        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

export function getStatusDotColor(status) {
  switch (status) {
    case 'passed':  return 'bg-green-500'
    case 'failed':  return 'bg-red-500'
    case 'flaky':   return 'bg-yellow-500'
    case 'skipped': return 'bg-gray-400'
    default:        return 'bg-gray-400'
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'passed':  return 'Passed'
    case 'failed':  return 'Failed'
    case 'flaky':   return 'Flaky'
    case 'skipped': return 'Skipped'
    default:        return status || 'Unknown'
  }
}

export function getStatusIcon(status) {
  switch (status) {
    case 'passed':  return '✓'
    case 'failed':  return '✗'
    case 'flaky':   return '⚡'
    case 'skipped': return '⊘'
    default:        return '?'
  }
}

/** Map a run-level status to display-friendly variant */
export function getRunStatusColor(status) {
  switch (status) {
    case 'passed': return 'text-green-600 dark:text-green-400'
    case 'failed': return 'text-red-600 dark:text-red-400'
    case 'flaky':  return 'text-yellow-600 dark:text-yellow-400'
    default:       return 'text-gray-500'
  }
}
