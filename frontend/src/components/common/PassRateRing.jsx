/**
 * SVG donut chart showing pass rate percentage.
 * Props: rate (0-100), size (px), strokeWidth
 */
export default function PassRateRing({ rate = 0, size = 80, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const filled = (rate / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  const color = rate >= 95 ? '#22c55e' : rate >= 80 ? '#eab308' : '#ef4444'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Pass rate: ${rate}%`}>
      {/* Background track */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-gray-700"
      />
      {/* Progress arc — starts at top (rotate -90deg) */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Center label */}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.2}
        fontWeight="700"
        fill={color}
      >
        {Math.round(rate)}%
      </text>
    </svg>
  )
}
