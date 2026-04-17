import { formatDuration } from '../../utils/formatDuration'
import { getStatusColor, getStatusIcon } from '../../utils/statusHelpers'

export default function TestCaseDetail({ tc }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-b-lg px-4 py-3 space-y-3 text-sm border-t border-gray-200 dark:border-gray-700">
      {/* Location */}
      {tc.file_path && (
        <div className="text-gray-500 dark:text-gray-400 font-mono text-xs">
          {tc.file_path}{tc.line ? `:${tc.line}` : ''}
        </div>
      )}

      {/* Tags */}
      {tc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tc.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Error message */}
      {tc.error_message && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Error</p>
          <pre className="text-xs text-red-600 dark:text-red-300 whitespace-pre-wrap break-all leading-relaxed">
            {tc.error_message}
          </pre>
        </div>
      )}

      {/* Error details */}
      {tc.error_details?.length > 0 && (
        <div className="space-y-2">
          {tc.error_details.map((e, i) => (
            e.message && (
              <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                {e.file && (
                  <p className="text-xs font-mono text-red-500 dark:text-red-400 mb-1">
                    {e.file}{e.line ? `:${e.line}` : ''}{e.column ? `:${e.column}` : ''}
                  </p>
                )}
                <pre className="text-xs text-red-600 dark:text-red-300 whitespace-pre-wrap break-all leading-relaxed">
                  {e.message}
                </pre>
              </div>
            )
          ))}
        </div>
      )}

      {/* Retry timeline */}
      {tc.results?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Attempts ({tc.results.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {tc.results.map((r) => (
              <div key={r.retry} className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5">
                <span className={`text-sm ${getStatusColor(r.status)}`}>{getStatusIcon(r.status)}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {r.retry === 0 ? 'Initial' : `Retry ${r.retry}`}
                </span>
                <span className="text-xs text-gray-400">{formatDuration(r.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
