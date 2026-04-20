import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PassRateRing from '../common/PassRateRing'
import StatusBadge from '../common/StatusBadge'
import TriggerJenkinsButton from '../common/TriggerJenkinsButton'
import EmailReportButton from './EmailReportButton'
import { formatDuration } from '../../utils/formatDuration'
import { deleteRun } from '../../api/client'

export default function RunDetailHeader({ run, slug, showToast, jenkinsUrl, projectName }) {
  const s   = run?.summary || {}
  const env = run?.environment || {}
  const ci  = run?.ci_info || {}
  const navigate = useNavigate()
  const cardRef = useRef(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteRun(slug, run.run_number)
      showToast?.(`Run #${run.run_number} deleted.`, 'success')
      navigate(`/projects/${slug}/history`, { replace: true })
    } catch (err) {
      showToast?.(err.message, 'error')
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div ref={cardRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Pass rate ring */}
        <div className="flex-shrink-0">
          <PassRateRing rate={s.pass_rate ?? 0} size={96} strokeWidth={9} />
        </div>

        {/* Stat cards */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {run.sprint
                ? `${[projectName, run.sprint].filter(Boolean).join(' ')}`
                : 'No Sprint Specified'}
            </h2>
            <StatusBadge status={run.status} />

            {/* Actions */}
            <div data-html2canvas-ignore className="ml-auto flex items-center gap-2">
              <EmailReportButton run={run} projectName={projectName} slug={slug} showToast={showToast} cardRef={cardRef} />
              {jenkinsUrl && (
                <TriggerJenkinsButton slug={slug} showToast={showToast} />
              )}
              {!confirming ? (
                <button
                  onClick={() => setConfirming(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete this run"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Delete run #{run.run_number}?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard label="Total"   value={s.total ?? 0}   color="text-gray-700 dark:text-gray-300" />
            <StatCard label="Passed"  value={s.passed ?? 0}  color="text-green-600 dark:text-green-400" />
            <StatCard label="Failed"  value={s.failed ?? 0}  color="text-red-600 dark:text-red-400" />
            <StatCard label="Skipped" value={s.skipped ?? 0} color="text-gray-500 dark:text-gray-400" />
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span>Duration: <b className="text-gray-700 dark:text-gray-300">{formatDuration(run.duration)}</b></span>
            {run.started_at && (
              <span>Started: <b className="text-gray-700 dark:text-gray-300">{new Date(run.started_at).toLocaleString()}</b></span>
            )}
            {env.playwright_version && (
              <span>Playwright: <b className="text-gray-700 dark:text-gray-300">v{env.playwright_version}</b></span>
            )}
            {env.actual_workers && (
              <span>Workers: <b className="text-gray-700 dark:text-gray-300">{env.actual_workers}</b></span>
            )}
          </div>
        </div>
      </div>

      {/* CI info */}
      {(ci.commit_hash || ci.branch) && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          {ci.branch && <span>Branch: <b className="text-gray-700 dark:text-gray-300">{ci.branch}</b></span>}
          {ci.commit_hash && (
            <span>
              Commit:{' '}
              {ci.commit_href ? (
                <a href={ci.commit_href} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline">
                  {ci.commit_hash.slice(0, 7)}
                </a>
              ) : (
                <code className="text-gray-700 dark:text-gray-300">{ci.commit_hash.slice(0, 7)}</code>
              )}
            </span>
          )}
          {ci.commit_subject && (
            <span className="truncate max-w-xs" title={ci.commit_subject}>{ci.commit_subject}</span>
          )}
          {ci.commit_author && <span>by {ci.commit_author}</span>}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}
