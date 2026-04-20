import { useParams } from 'react-router-dom'
import { useState, useDeferredValue } from 'react'
import { useTestRun, useTestCases } from '../hooks/useTestRun'
import { useProject } from '../hooks/useProject'
import RunDetailHeader from '../components/runs/RunDetailHeader'
import StatusFilter from '../components/runs/StatusFilter'
import TestCaseList from '../components/runs/TestCaseList'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { ToastContainer, useToast } from '../components/common/Toast'

export default function RunDetailPage() {
  const { slug, number } = useParams()
  const { run, loading, error } = useTestRun(slug, number)
  const { project } = useProject(slug)
  const [status, setStatus]   = useState('')
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput)
  const { toasts, showToast, dismissToast } = useToast()

  const { cases, total } = useTestCases(slug, number, { status, search })

  if (loading) return <LoadingSpinner className="py-20" />
  if (error)   return <div className="p-6 text-red-500">{error}</div>
  if (!run)    return <div className="p-6 text-gray-500">Run not found.</div>

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <RunDetailHeader run={run} slug={slug} showToast={showToast} jenkinsUrl={project?.jenkins_url} projectName={project?.name} />

      <div className="flex flex-col sm:flex-row gap-3">
        <StatusFilter value={status} onChange={setStatus} summary={run.summary} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or tag…"
          className="flex-1 max-w-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <TestCaseList cases={cases} total={total} />
    </div>
  )
}
