import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function PassRateChart({ data = [] }) {
  const chartData = data.map((r) => ({
    run: `#${r.run_number}`,
    rate: r.summary?.pass_rate ?? 0,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Pass Rate Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="run" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, 'Pass Rate']} />
          <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="4 4" />
          <Line
            type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2}
            dot={{ r: 3 }} activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
