import { useState } from 'react'
import { updateProject, generateApiKey } from '../../api/client'

export default function ProjectSettings({ project, onUpdate, showToast }) {
  const [name, setName]           = useState(project.name)
  const [description, setDesc]    = useState(project.description || '')
  const [jenkinsUrl, setJenkinsUrl] = useState(project.jenkins_url || '')
  const [apiKey, setApiKey]       = useState(null)
  const [saving, setSaving]       = useState(false)
  const [generatingKey, setGenKey] = useState(false)
  const [showConfirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied]       = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateProject(project.slug, { name, description, jenkins_url: jenkinsUrl })
      onUpdate?.(updated)
      showToast?.('Project updated.', 'success')
    } catch (err) {
      showToast?.(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateKey = async () => {
    setGenKey(true)
    try {
      const data = await generateApiKey(project.slug)
      setApiKey(data.api_key)
      showToast?.('New API key generated.', 'success')
    } catch (err) {
      showToast?.(err.message, 'error')
    } finally {
      setGenKey(false)
    }
  }

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const displayKey = apiKey || (project.has_api_key ? 'rpt_••••••••••••••••••••••••••••••••' : null)

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">General</h2>
        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description} onChange={(e) => setDesc(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Project Slug</label>
            <code className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {project.slug}
            </code>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenkins Trigger URL</label>
            <input
              type="url" value={jenkinsUrl} onChange={(e) => setJenkinsUrl(e.target.value)}
              placeholder="https://jenkins.example.com/job/my-job/build?token=TOKEN"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Remote trigger URL with token parameter. Leave blank to disable.
            </p>
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* API Key */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">API Key</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Use this key to upload reports from CI/CD pipelines.
        </p>
        <div className="flex items-center gap-3 max-w-lg">
          <code className="flex-1 text-sm font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-gray-800 dark:text-gray-200 overflow-x-auto">
            {displayKey || 'No API key generated yet'}
          </code>
          {apiKey && (
            <button onClick={copyKey}
              className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          <button onClick={handleGenerateKey} disabled={generatingKey}
            className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50">
            {generatingKey ? '…' : (project.has_api_key ? 'Regenerate' : 'Generate')}
          </button>
        </div>
        {apiKey && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Copy this key now — it won't be shown again in full.
          </p>
        )}
      </section>

      {/* Danger Zone */}
      <section className="border border-red-200 dark:border-red-900/50 rounded-xl p-5">
        <h2 className="text-base font-semibold text-red-600 dark:text-red-400 mb-1">Danger Zone</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Deleting a project permanently removes all its runs and test cases.
        </p>
        {!showConfirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            Delete Project
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 dark:text-gray-300">Are you sure?</span>
            <button onClick={() => onUpdate?.('delete')}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg">
              Yes, delete
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
