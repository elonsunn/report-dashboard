import { useState } from 'react'
import { triggerJenkins } from '../../api/client'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatSprint(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${year}-${MONTHS[parseInt(month, 10) - 1]}-${day}`
}

export default function TriggerJenkinsButton({ slug, showToast, className = '' }) {
  const [showDialog, setShowDialog] = useState(false)
  const [dateValue, setDateValue]   = useState('')
  const [submitted, setSubmitted]   = useState(false)
  const [triggering, setTriggering] = useState(false)

  const openDialog = () => {
    setDateValue('')
    setSubmitted(false)
    setShowDialog(true)
  }

  const handleTrigger = async () => {
    setSubmitted(true)
    if (!dateValue) return
    setTriggering(true)
    try {
      await triggerJenkins(slug, formatSprint(dateValue))
      showToast?.('Jenkins pipeline triggered.', 'success')
      setShowDialog(false)
    } catch (err) {
      showToast?.(err.message, 'error')
    } finally {
      setTriggering(false)
    }
  }

  const invalid = submitted && !dateValue

  return (
    <>
      <button
        onClick={openDialog}
        title="Trigger Jenkins pipeline"
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-500 text-white rounded-lg transition-colors ${className}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z" />
        </svg>
        Trigger Pipeline
      </button>

      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDialog(false) }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Trigger Jenkins Pipeline
            </h3>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sprint Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => { setDateValue(e.target.value); setSubmitted(false) }}
                onKeyDown={(e) => e.key === 'Enter' && !triggering && handleTrigger()}
                autoFocus
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  invalid
                    ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {dateValue && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Stored as: <span className="font-mono">{formatSprint(dateValue)}</span>
                </p>
              )}
              {invalid && (
                <p className="text-xs text-red-500 mt-1">Sprint date is required.</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDialog(false)}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTrigger}
                disabled={triggering}
                className="px-4 py-2 text-sm bg-gray-800 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {triggering ? 'Triggering…' : 'Trigger'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
