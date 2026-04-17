import { useState } from 'react'

export default function ProjectForm({ onSubmit, onCancel, loading }) {
  const [name, setName]         = useState('')
  const [description, setDesc]  = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim(), description.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Playwright Project"
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Optional project description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading || !name.trim()}
          className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors">
          {loading ? 'Creating…' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
