import { Link } from 'react-router-dom'

/**
 * Breadcrumb navigation.
 * Props: items — array of { label, to? } (last item has no `to`)
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-gray-100 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
