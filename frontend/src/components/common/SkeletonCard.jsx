/**
 * Skeleton loader for project cards and table rows.
 */
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
        </div>
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/3" />
        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-2/3" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-600 rounded w-24" />
      <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-20" />
    </div>
  )
}

export function SkeletonRunHeader() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex gap-5">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
