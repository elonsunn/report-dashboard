import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useTrends } from '../hooks/useTrends'
import { useProject } from '../hooks/useProject'
import PassRateChart from '../components/trends/PassRateChart'
import DurationChart from '../components/trends/DurationChart'
import CaseCountChart from '../components/trends/CaseCountChart'
import TopFailingTests from '../components/trends/TopFailingTests'
import LoadingSpinner from '../components/common/LoadingSpinner'
import TriggerJenkinsButton from '../components/common/TriggerJenkinsButton'
import { ToastContainer, useToast } from '../components/common/Toast'

const RANGES = [
  { label: 'Last 10', value: 10 },
  { label: 'Last 30', value: 30 },
  { label: 'All',     value: 1000 },
]

export default function TrendsPage() {
  const { slug } = useParams()
  const [limit, setLimit] = useState(30)
  const { trends, topFailing, topFlaky, loading, error } = useTrends(slug, limit)
  const { project } = useProject(slug)
  const { toasts, showToast, dismissToast } = useToast()

  if (loading) return <LoadingSpinner className="py-20" />
  if (error)   return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trends</h1>
        <div className="flex gap-2 items-center">
          {project?.jenkins_url && (
            <TriggerJenkinsButton slug={slug} showToast={showToast} />
          )}
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setLimit(r.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                limit === r.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PassRateChart data={trends} />
        <DurationChart data={trends} />
        <CaseCountChart data={trends} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopFailingTests data={topFailing} title="Top 10 Failing Tests" color="#ef4444" />
        <TopFailingTests data={topFlaky}   title="Top 10 Flaky Tests"   color="#eab308" />
      </div>
    </div>
  )
}
