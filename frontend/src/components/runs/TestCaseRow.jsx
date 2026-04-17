import { useState } from 'react'
import { formatDuration } from '../../utils/formatDuration'
import { getStatusColor, getStatusIcon } from '../../utils/statusHelpers'
import TestCaseDetail from './TestCaseDetail'

export default function TestCaseRow({ tc, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left"
      >
        {/* Status icon */}
        <span className={`w-5 text-center text-sm font-bold flex-shrink-0 ${getStatusColor(tc.status)}`}>
          {getStatusIcon(tc.status)}
        </span>

        {/* Title */}
        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">{tc.title}</span>

        {/* Tags */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          {tc.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>

        {/* Retry badge */}
        {tc.retry_count > 0 && (
          <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs flex-shrink-0">
            {tc.retry_count} retry
          </span>
        )}

        {/* Duration */}
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 w-16 text-right">
          {formatDuration(tc.duration)}
        </span>

        {/* Expand chevron */}
        <span className={`text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {expanded && <TestCaseDetail tc={tc} />}
    </div>
  )
}
