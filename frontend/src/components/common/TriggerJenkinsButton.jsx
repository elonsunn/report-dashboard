import { useState } from 'react'
import { triggerJenkins } from '../../api/client'

export default function TriggerJenkinsButton({ slug, showToast, className = '' }) {
  const [triggering, setTriggering] = useState(false)

  const handleTrigger = async () => {
    setTriggering(true)
    try {
      await triggerJenkins(slug)
      showToast?.('Jenkins build triggered.', 'success')
    } catch (err) {
      showToast?.(err.message, 'error')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <button
      onClick={handleTrigger}
      disabled={triggering}
      title="Trigger Jenkins pipeline"
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors ${className}`}
    >
      {/* Gear icon */}
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z" />
      </svg>
      {triggering ? 'Triggering…' : 'Trigger Pipeline'}
    </button>
  )
}
