import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import ProjectCard from '../components/projects/ProjectCard'
import ProjectForm from '../components/projects/ProjectForm'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { SkeletonCard } from '../components/common/SkeletonCard'
import EmptyState from '../components/common/EmptyState'
import { ToastContainer, useToast } from '../components/common/Toast'

export default function ProjectListPage() {
  const { projects, loading, error, createProject } = useProjects()
  const [showModal, setShowModal]   = useState(false)
  const [creating, setCreating]     = useState(false)
  const [search, setSearch]         = useState('')
  const { toasts, showToast, dismissToast } = useToast()

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (name, description) => {
    setCreating(true)
    try {
      await createProject(name, description)
      setShowModal(false)
      showToast('Project created!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span>+</span> New Project
        </button>
      </div>

      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-full max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No projects match your search' : 'No projects yet'}
          description={search ? 'Try a different search term.' : 'Create your first project to start tracking Playwright test runs.'}
          action={
            !search && (
              <button onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
                Create Project
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">New Project</h2>
            <ProjectForm
              onSubmit={handleCreate}
              onCancel={() => setShowModal(false)}
              loading={creating}
            />
          </div>
        </div>
      )}
    </div>
  )
}
