import { Link } from 'react-router-dom'
import PassRateRing from '../common/PassRateRing'
import StatusBadge from '../common/StatusBadge'
import { formatDuration } from '../../utils/formatDuration'

export default function ProjectCard({ project }) {
  const run = project.latest_run
  const passRate = run?.summary?.pass_rate ?? 0

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{project.description}</p>
          )}
        </div>
        {run && <PassRateRing rate={passRate} size={64} strokeWidth={6} />}
      </div>

      {run ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={run.status} />
            <span className="text-xs text-gray-500 dark:text-gray-400">Run #{run.run_number}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 dark:text-green-400 font-medium">
              {run.summary?.passed ?? 0} passed
            </span>
            {(run.summary?.failed ?? 0) > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                {run.summary.failed} failed
              </span>
            )}
            <span className="text-gray-400 dark:text-gray-500">
              {run.summary?.total ?? 0} total
            </span>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {formatDuration(run.duration)} ·{' '}
            {run.started_at ? new Date(run.started_at).toLocaleString() : '—'}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">No runs yet</p>
      )}
    </Link>
  )
}
