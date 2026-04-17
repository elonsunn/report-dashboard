import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function CaseCountChart({ data = [] }) {
  const chartData = data.map((r) => ({
    run:     `#${r.run_number}`,
    Passed:  r.summary?.passed ?? 0,
    Failed:  r.summary?.failed ?? 0,
    Flaky:   r.summary?.flaky ?? 0,
    Skipped: r.summary?.skipped ?? 0,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Test Count per Run</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="run" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Passed"  stackId="a" fill="#22c55e" />
          <Bar dataKey="Failed"  stackId="a" fill="#ef4444" />
          <Bar dataKey="Flaky"   stackId="a" fill="#eab308" />
          <Bar dataKey="Skipped" stackId="a" fill="#9ca3af" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
