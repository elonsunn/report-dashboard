import { useParams, Link } from 'react-router-dom'
import { useTestRun } from '../hooks/useTestRun'
import { useTestCases } from '../hooks/useTestRun'
import RunDetailHeader from '../components/runs/RunDetailHeader'
import TestCaseList from '../components/runs/TestCaseList'
import StatusFilter from '../components/runs/StatusFilter'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { SkeletonRunHeader } from '../components/common/SkeletonCard'
import EmptyState from '../components/common/EmptyState'
import { useState, useDeferredValue } from 'react'

export default function ProjectDetailPage() {
  const { slug } = useParams()
  const { run, loading, error } = useTestRun(slug, 'latest')
  const [status, setStatus]   = useState('')
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput)

  const { cases, total } = useTestCases(
    slug,
    run?.run_number,
    { status, search }
  )

  if (loading) return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <SkeletonRunHeader />
    </div>
  )
  if (error)   return <div className="p-6 text-red-500">{error}</div>

  if (!run) {
    return (
      <EmptyState
        title="No runs yet"
        description="Upload your first Playwright report to get started."
        action={
          <Link to={`/projects/${slug}/upload`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
            Upload Report
          </Link>
        }
      />
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <RunDetailHeader run={run} slug={slug} />

      <div className="flex flex-col sm:flex-row gap-3">
        <StatusFilter value={status} onChange={setStatus} summary={run.summary} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tests…"
          className="flex-1 max-w-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <TestCaseList cases={cases} total={total} />
    </div>
  )
}
