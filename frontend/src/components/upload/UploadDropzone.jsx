import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { uploadReportFile } from '../../api/client'

export default function UploadDropzone({ slug, showToast }) {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState(0)
  const [selectedFile, setSelected] = useState(null)

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setSelected(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setProgress(30)
    try {
      setProgress(60)
      const result = await uploadReportFile(slug, selectedFile)
      setProgress(100)
      showToast?.(`Run #${result.run_number} uploaded successfully!`, 'success')
      setTimeout(() => navigate(`/projects/${slug}/runs/${result.run_number}`), 500)
    } catch (err) {
      showToast?.(err.message, 'error')
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : selectedFile
            ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">{selectedFile ? '✓' : '📄'}</div>
        {selectedFile ? (
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {(selectedFile.size / 1024).toFixed(1)} KB — click to change
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              {isDragActive ? 'Drop your results.json here' : 'Drag & drop your results.json'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {uploading ? 'Uploading…' : 'Upload Report'}
      </button>
    </div>
  )
}
