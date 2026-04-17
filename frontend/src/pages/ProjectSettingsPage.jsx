import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getProject, deleteProject } from '../api/client'
import ProjectSettings from '../components/projects/ProjectSettings'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { ToastContainer, useToast } from '../components/common/Toast'

export default function ProjectSettingsPage() {
  const { slug }    = useParams()
  const navigate    = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    getProject(slug)
      .then((d) => setProject(d))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleUpdate = async (updatedOrDelete) => {
    if (updatedOrDelete === 'delete') {
      try {
        await deleteProject(slug)
        navigate('/')
      } catch (err) {
        showToast(err.message, 'error')
      }
    } else {
      setProject(updatedOrDelete)
    }
  }

  if (loading) return <LoadingSpinner className="py-20" />
  if (!project) return <div className="p-6 text-gray-500">Project not found.</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>
      <ProjectSettings project={project} onUpdate={handleUpdate} showToast={showToast} />
    </div>
  )
}
