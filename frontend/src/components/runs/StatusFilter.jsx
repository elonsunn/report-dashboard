const FILTERS = [
  { value: '',         label: 'All' },
  { value: 'passed',  label: 'Passed' },
  { value: 'failed',  label: 'Failed' },
  { value: 'flaky',   label: 'Flaky' },
  { value: 'skipped', label: 'Skipped' },
]

const ACTIVE = {
  '':        'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  passed:    'bg-green-600 text-white',
  failed:    'bg-red-600 text-white',
  flaky:     'bg-yellow-500 text-white',
  skipped:   'bg-gray-500 text-white',
}

export default function StatusFilter({ value, onChange, summary }) {
  const counts = {
    '':        summary?.total ?? 0,
    passed:    summary?.passed ?? 0,
    failed:    summary?.failed ?? 0,
    flaky:     summary?.flaky ?? 0,
    skipped:   summary?.skipped ?? 0,
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === f.value
              ? ACTIVE[f.value]
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {f.label}
          {counts[f.value] > 0 && (
            <span className="ml-1.5 opacity-75">({counts[f.value]})</span>
          )}
        </button>
      ))}
    </div>
  )
}
