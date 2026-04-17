import { getStatusBgColor, getStatusLabel } from '../../utils/statusHelpers'

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(status)} ${className}`}>
      {getStatusLabel(status)}
    </span>
  )
}
