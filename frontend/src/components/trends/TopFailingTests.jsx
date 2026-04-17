import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

/**
 * Horizontal bar chart showing top failing or flaky tests.
 * Props: data — [{title, count}], title, color
 */
export default function TopFailingTests({ data = [], title = 'Top Failing Tests', color = '#ef4444' }) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No data</p>
      </div>
    )
  }

  const chartData = data.map((t) => ({
    name:  t.title.length > 40 ? t.title.slice(0, 38) + '…' : t.title,
    full:  t.title,
    count: t.count,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={chartData.length * 36 + 20}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v, _, { payload }) => [v, 'Occurrences']}
            labelFormatter={(_, data) => data[0]?.payload?.full || ''}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill={color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
