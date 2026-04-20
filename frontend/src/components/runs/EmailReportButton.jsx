import { useState } from 'react'
import { getRuns } from '../../api/client'

// ---------------------------------------------------------------------------
// Email template builders
// ---------------------------------------------------------------------------

function buildHtml({ sprintLabel, bodyText, screenshot, dashboardUrl }) {
  // Double newlines → paragraph breaks; single newlines → <br> within a paragraph
  const paragraphs = bodyText.split(/\n{2,}/).filter(s => s.trim())
  const bodyHtml = paragraphs
    .map(p => `<p style="font-size:14px;color:#374151;margin:0 0 12px;line-height:1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n  ')

  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827;padding:24px 16px;background:#fff;">
  <h2 style="margin:0 0 16px;font-size:20px;">${sprintLabel}</h2>

  ${bodyHtml}

  ${screenshot
    ? `<img src="${screenshot}" alt="Run summary" style="width:100%;max-width:560px;border-radius:8px;border:1px solid #e5e7eb;margin:16px 0;display:block;">`
    : ''
  }

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

  <p style="font-size:13px;margin:0;">
    <a href="${dashboardUrl}" style="color:#4f46e5;text-decoration:none;">Click this link to view the full report in the dashboard →</a>
  </p>
</body>
</html>`
}

function buildPlainText({ sprintLabel, bodyText, dashboardUrl }) {
  return [sprintLabel, '', bodyText, '', `Dashboard: ${dashboardUrl}`].join('\n')
}

function buildBodyText({ projectName, run, s, prevTotal }) {
  const label = run.sprint? `${projectName} ${run.sprint}`: projectName
  const total   = s.total   ?? 0
  const newScripts = prevTotal !== null && total > prevTotal ? total - prevTotal : 0

  const parts = [
    'Dear Team,',
    `Please find below the automated test execution report for ${label}.`,
  ]

  if (newScripts > 0) {
    parts.push(
      `This sprint includes ${newScripts} newly added test script${newScripts !== 1 ? 's' : ''} (previously ${prevTotal}, now ${total} total).`
    )
  }

  // parts.push('Please see the attached screenshot for the detailed run summary.')

  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailReportButton({ run, projectName, slug, showToast, cardRef, className = '' }) {
  const [showModal, setShowModal] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [bodyText, setBodyText] = useState('')

  const s = run?.summary || {}
  const sprintLabel = run.sprint ? `${projectName} ${run.sprint}` : projectName
  const dashboardUrl = `${window.location.origin}/projects/${slug}/runs/${run.run_number}`

  const handleOpen = async () => {
    setCapturing(true)

    // Fetch previous run to calculate new scripts added
    let prevTotal = null
    try {
      const { runs } = await getRuns(slug, 1, 50)
      const prev = runs.find(r => r.run_number < run.run_number)
      if (prev?.summary?.total != null) prevTotal = prev.summary.total
    } catch {
      // comparison unavailable — body still generates without new-scripts line
    }

    setBodyText(buildBodyText({ projectName, run, s, prevTotal }))

    // Capture screenshot
    let imgDataUrl = null
    try {
      const { toPng } = await import('html-to-image')
      const el = cardRef?.current
      if (el) {
        imgDataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff' })
      }
    } catch (err) {
      console.error('[EmailReport] screenshot failed:', err)
    }

    setScreenshot(imgDataUrl)
    setCapturing(false)
    setShowModal(true)
  }

  const emailHtml = buildHtml({ sprintLabel, bodyText, screenshot, dashboardUrl })
  const plainText  = buildPlainText({ sprintLabel, bodyText, dashboardUrl })

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': new Blob([emailHtml], { type: 'text/html' }) }),
      ])
      showToast?.('Rich email copied — paste into Outlook.', 'success')
    } catch {
      await navigator.clipboard.writeText(plainText)
      showToast?.('Copied as plain text.', 'info')
    }
  }

  const downloadScreenshot = () => {
    if (!screenshot) return
    const a = document.createElement('a')
    a.href = screenshot
    a.download = `${run.sprint || `run-${run.run_number}`}.png`
    a.click()
  }

  const openEmailClient = () => {
    const subject = encodeURIComponent(sprintLabel)
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(plainText)}`
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={capturing}
        title="Generate email report"
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {capturing ? 'Preparing…' : 'Email Report'}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Email Report</h3>
              <button onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message</label>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Preview</label>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={emailHtml}
                    title="Email preview"
                    className="w-full"
                    style={{ height: 420, border: 'none' }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
              {screenshot && (
                <button onClick={downloadScreenshot}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Screenshot
                </button>
              )}
              <button onClick={openEmailClient}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Open Email Client
              </button>
              <button onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
