import { useState } from 'react'
import TestCaseRow from './TestCaseRow'
import EmptyState from '../common/EmptyState'

/**
 * Groups test cases by suite_title and renders each group as a collapsible section.
 * Cases with the same suite title from different files are merged into one group.
 */
export default function TestCaseList({ cases = [], total = 0 }) {
  if (cases.length === 0) {
    return <EmptyState title="No tests found" description="Try clearing filters or search." />
  }

  // Group by suite_title; same title across files merges into one group
  const groups = {}
  for (const tc of cases) {
    const key = tc.suite_title || 'No Suite'
    if (!groups[key]) groups[key] = []
    groups[key].push(tc)
  }

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([suite, tcs]) => (
        <SuiteGroup key={suite} suite={suite} cases={tcs} />
      ))}
    </div>
  )
}

function SuiteGroup({ suite, cases }) {
  const [open, setOpen] = useState(false)
  const passedCount  = cases.filter((tc) => tc.status === 'passed').length
  const failedCount  = cases.filter((tc) => tc.status === 'failed').length
  const skippedCount = cases.filter((tc) => tc.status === 'skipped').length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{suite}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{cases.length} test{cases.length !== 1 ? 's' : ''}</span>
        {passedCount > 0 && (
          <span className="text-xs text-green-600 dark:text-green-400">{passedCount} passed</span>
        )}
        {failedCount > 0 && (
          <span className="text-xs text-red-600 dark:text-red-400">{failedCount} failed</span>
        )}
        {skippedCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{skippedCount} skipped</span>
        )}
      </button>

      {open && (
        <div>
          {cases.map((tc) => (
            <TestCaseRow
              key={tc.id}
              tc={tc}
              defaultExpanded={tc.status === 'failed'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
