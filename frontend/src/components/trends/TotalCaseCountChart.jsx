import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'

export default function TotalCaseCountChart({ data = [] }) {
  // Only keep runs where the total count differs from the previous run.
  // This shows test-suite growth and avoids a flat line of repeated values.
  const chartData = data.reduce((acc, run) => {
    const total = run.summary?.total ?? 0
    if (acc.length === 0 || total !== acc[acc.length - 1].total) {
      acc.push({ run: `#${run.run_number}`, total })
    }
    return acc
  }, [])

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Test Suite Growth</h3>
        <div className="h-[200px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          No data
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Test Suite Growth
        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
          runs where count changed
        </span>
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 18, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="run" tick={{ fontSize: 11 }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [v, 'Total Tests']} />
          <Line
            type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2}
            dot={{ r: 4 }} activeDot={{ r: 6 }}
          >
            <LabelList dataKey="total" position="top" style={{ fontSize: 11, fill: '#6b7280' }} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
