import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { getRuns, deleteRun } from '../api/client'
import { useProject } from '../hooks/useProject'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import { SkeletonRow } from '../components/common/SkeletonCard'
import { formatDuration } from '../utils/formatDuration'
import { ToastContainer, useToast } from '../components/common/Toast'
import TriggerJenkinsButton from '../components/common/TriggerJenkinsButton'

export default function RunHistoryPage() {
  const { slug } = useParams()
  const { project } = useProject(slug)
  const [runs, setRuns]     = useState([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [deletingId, setDeletingId]     = useState(null)
  const { toasts, showToast, dismissToast } = useToast()
  const PER_PAGE = 20

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const data = await getRuns(slug, p, PER_PAGE)
      setRuns((prev) => p === 1 ? data.runs : [...prev, ...data.runs])
      setTotal(data.total)
      setPage(p)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load(1) }, [load])

  const hasMore = runs.length < total

  const handleDelete = async (runNumber) => {
    setDeletingId(runNumber)
    try {
      await deleteRun(slug, runNumber)
      showToast(`Run #${runNumber} deleted.`, 'success')
      setRuns((prev) => prev.filter((r) => r.run_number !== runNumber))
      setTotal((t) => t - 1)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeletingId(null)
      setConfirmingId(null)
    }
  }

  if (loading && page === 1) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-5 animate-pulse" />
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {[1,2,3,4,5].map((i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (runs.length === 0) {
    return <EmptyState title="No runs yet" description="Upload your first Playwright report." />
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Run History</h1>
        <div className="flex items-center gap-3">
          {project?.jenkins_url && (
            <TriggerJenkinsButton slug={slug} showToast={showToast} />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">{total} total run{total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sprint</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pass Rate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Results</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Commit</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {runs.map((run) => (
              <tr
                key={run.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link to={`/projects/${slug}/runs/${run.run_number}`}
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    {run.sprint || 'No Sprint Specified'}
                  </Link>
                </td>
                <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${
                    (run.summary?.pass_rate ?? 0) >= 95 ? 'text-green-600 dark:text-green-400' :
                    (run.summary?.pass_rate ?? 0) >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {(run.summary?.pass_rate ?? 0).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">
                  <span className="text-green-600 dark:text-green-400">{run.summary?.passed ?? 0}</span>
                  {' / '}
                  <span className="text-red-600 dark:text-red-400">{run.summary?.failed ?? 0}</span>
                  {' / '}
                  {run.summary?.total ?? 0}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-500 dark:text-gray-400">
                  {formatDuration(run.duration)}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {run.ci_info?.commit_hash ? (
                    <a href={run.ci_info.commit_href || '#'} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      title={run.ci_info.commit_subject}>
                      {run.ci_info.commit_hash.slice(0, 7)}
                    </a>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {confirmingId === run.run_number ? (
                    <span className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(run.run_number)}
                        disabled={deletingId === run.run_number}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded transition-colors"
                      >
                        {deletingId === run.run_number ? 'Deleting…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(run.run_number)}
                      className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                      title="Delete run"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={() => load(page + 1)}
            disabled={loading}
            className="px-5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading…' : `Load More (${total - runs.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  )
}
