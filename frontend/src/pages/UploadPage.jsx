import { useParams } from 'react-router-dom'
import UploadDropzone from '../components/upload/UploadDropzone'
import { ToastContainer, useToast } from '../components/common/Toast'

export default function UploadPage() {
  const { slug } = useParams()
  const { toasts, showToast, dismissToast } = useToast()

  return (
    <div className="p-6 max-w-lg mx-auto">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Upload Report</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Upload a Playwright <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">results.json</code> file.
      </p>

      <UploadDropzone slug={slug} showToast={showToast} />
    </div>
  )
}
