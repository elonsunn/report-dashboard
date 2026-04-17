import { useParams } from 'react-router-dom'
import UploadDropzone from '../components/upload/UploadDropzone'
import { ToastContainer, useToast } from '../components/common/Toast'
import { useProject } from '../hooks/useProject'
import TriggerJenkinsButton from '../components/common/TriggerJenkinsButton'

export default function UploadPage() {
  const { slug } = useParams()
  const { toasts, showToast, dismissToast } = useToast()
  const { project } = useProject(slug)

  return (
    <div className="p-6 max-w-lg mx-auto">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Report</h1>
        {project?.jenkins_url && (
          <TriggerJenkinsButton slug={slug} showToast={showToast} />
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Upload a Playwright <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">results.json</code> file.
      </p>

      <UploadDropzone slug={slug} showToast={showToast} />
    </div>
  )
}
