import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDuration, formatDurationSeconds } from '../../utils/formatDuration'

export default function DurationChart({ data = [] }) {
  const chartData = data.map((r) => ({
    run:      `#${r.run_number}`,
    duration: formatDurationSeconds(r.duration),
    raw:      r.duration,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Duration Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="run" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `${v}s`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(_, __, props) => [formatDuration(props.payload.raw), 'Duration']} />
          <Line
            type="monotone" dataKey="duration" stroke="#8b5cf6" strokeWidth={2}
            dot={{ r: 3 }} activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
