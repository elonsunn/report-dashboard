import { useParams, Link } from 'react-router-dom'
import { useTestRun } from '../hooks/useTestRun'
import { useTestCases } from '../hooks/useTestRun'
import { useProject } from '../hooks/useProject'
import RunDetailHeader from '../components/runs/RunDetailHeader'
import TestCaseList from '../components/runs/TestCaseList'
import StatusFilter from '../components/runs/StatusFilter'
import { SkeletonRunHeader } from '../components/common/SkeletonCard'
import EmptyState from '../components/common/EmptyState'
import { ToastContainer, useToast } from '../components/common/Toast'
import TriggerJenkinsButton from '../components/common/TriggerJenkinsButton'
import { useState, useDeferredValue } from 'react'

export default function ProjectDetailPage() {
  const { slug } = useParams()
  const { run, loading, error } = useTestRun(slug, 'latest')
  const { project } = useProject(slug)
  const { toasts, showToast, dismissToast } = useToast()
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
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <EmptyState
          title="No runs yet"
          description={
            project?.jenkins_url
              ? 'Trigger the pipeline to start your first run.'
              : 'Configure the pipeline URL in settings to get started.'
          }
          action={
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to={`/projects/${slug}/settings`}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg">
                Go to Settings
              </Link>
              {project?.jenkins_url && (
                <TriggerJenkinsButton slug={slug} showToast={showToast} />
              )}
            </div>
          }
        />
      </>
    )
  }

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
          placeholder="Search tests…"
          className="flex-1 max-w-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <TestCaseList cases={cases} total={total} />
    </div>
  )
}
