import { useState } from 'react'
import { formatDuration } from '../../utils/formatDuration'

// ---------------------------------------------------------------------------
// Email template builders
// ---------------------------------------------------------------------------

function buildHtml({ sprintLabel, passRate, statusColor, status, duration, startedAt, s, ci, screenshot, dashboardUrl }) {
  const cap = status.charAt(0).toUpperCase() + status.slice(1)
  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827;padding:24px 16px;background:#fff;">
  <h2 style="margin:0 0 6px;font-size:20px;">${sprintLabel}</h2>
  <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
    Status: <strong style="color:${statusColor};">${cap}</strong>
    &nbsp;·&nbsp; Pass Rate: <strong>${passRate}%</strong>
    &nbsp;·&nbsp; Duration: <strong>${duration}</strong>
    ${startedAt !== '—' ? `&nbsp;·&nbsp; Started: <strong>${startedAt}</strong>` : ''}
  </p>

  ${screenshot ? `<img src="${screenshot}" alt="Run summary" style="width:100%;max-width:560px;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:20px;display:block;">` : ''}

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
    <thead>
      <tr style="background:#f9fafb;">
        <th style="padding:8px 14px;text-align:left;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Metric</th>
        <th style="padding:8px 14px;text-align:right;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Count</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding:8px 14px;border:1px solid #e5e7eb;color:#374151;">Total</td><td style="padding:8px 14px;text-align:right;border:1px solid #e5e7eb;font-weight:600;">${s.total ?? 0}</td></tr>
      <tr style="background:#f0fdf4;"><td style="padding:8px 14px;border:1px solid #e5e7eb;color:#16a34a;">Passed</td><td style="padding:8px 14px;text-align:right;border:1px solid #e5e7eb;color:#16a34a;font-weight:600;">${s.passed ?? 0}</td></tr>
      <tr><td style="padding:8px 14px;border:1px solid #e5e7eb;color:#dc2626;">Failed</td><td style="padding:8px 14px;text-align:right;border:1px solid #e5e7eb;color:#dc2626;font-weight:600;">${s.failed ?? 0}</td></tr>
      ${(s.flaky ?? 0) > 0 ? `<tr style="background:#fefce8;"><td style="padding:8px 14px;border:1px solid #e5e7eb;color:#ca8a04;">Flaky</td><td style="padding:8px 14px;text-align:right;border:1px solid #e5e7eb;color:#ca8a04;font-weight:600;">${s.flaky}</td></tr>` : ''}
      <tr><td style="padding:8px 14px;border:1px solid #e5e7eb;color:#6b7280;">Skipped</td><td style="padding:8px 14px;text-align:right;border:1px solid #e5e7eb;color:#6b7280;font-weight:600;">${s.skipped ?? 0}</td></tr>
    </tbody>
  </table>

  ${ci.branch || ci.commit_hash ? `
  <div style="font-size:13px;color:#6b7280;margin-bottom:16px;padding:10px 14px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;">
    ${ci.branch ? `Branch: <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;">${ci.branch}</code>` : ''}
    ${ci.commit_hash ? `&nbsp; Commit: <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;">${ci.commit_hash.slice(0, 7)}</code>` : ''}
    ${ci.commit_subject ? `<br><span style="font-style:italic;margin-top:4px;display:block;">${ci.commit_subject}</span>` : ''}
    ${ci.commit_author ? `<span style="color:#9ca3af;margin-top:2px;display:block;">by ${ci.commit_author}</span>` : ''}
  </div>` : ''}

  <p style="font-size:13px;margin:0;">
    <a href="${dashboardUrl}" style="color:#4f46e5;text-decoration:none;">View full report in dashboard →</a>
  </p>
</body>
</html>`
}

function buildPlainText({ sprintLabel, passRate, status, duration, s, ci, dashboardUrl }) {
  return [
    sprintLabel,
    `Status: ${status} | Pass Rate: ${passRate}% | Duration: ${duration}`,
    `Total: ${s.total ?? 0} | Passed: ${s.passed ?? 0} | Failed: ${s.failed ?? 0} | Skipped: ${s.skipped ?? 0}`,
    ci.branch ? `Branch: ${ci.branch}${ci.commit_hash ? ` | Commit: ${ci.commit_hash.slice(0, 7)}` : ''}` : '',
    `Dashboard: ${dashboardUrl}`,
  ].filter(Boolean).join('\n')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailReportButton({ run, projectName, slug, showToast, cardRef, className = '' }) {
  const [showModal, setShowModal] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [capturing, setCapturing] = useState(false)

  const s   = run?.summary  || {}
  const ci  = run?.ci_info  || {}
  const sprintLabel = run.sprint
    ? `Sprint: ${[projectName, run.sprint].filter(Boolean).join(' ')}`
    : 'No Sprint Specified'
  const duration   = formatDuration(run.duration)
  const startedAt  = run.started_at ? new Date(run.started_at).toLocaleString() : '—'
  const passRate   = (s.pass_rate ?? 0).toFixed(1)
  const statusColor = run.status === 'passed' ? '#16a34a' : run.status === 'failed' ? '#dc2626' : '#ca8a04'
  const dashboardUrl = `${window.location.origin}/projects/${slug}`

  const handleOpen = async () => {
    setCapturing(true)
    let imgDataUrl = null
    try {
      const { default: html2canvas } = await import('html2canvas')
      const el = cardRef?.current
      if (el) {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
        imgDataUrl = canvas.toDataURL('image/png')
      }
    } catch {
      // screenshot unavailable — modal still opens without image
    }
    setScreenshot(imgDataUrl)
    setCapturing(false)
    setShowModal(true)
  }

  const emailHtml = buildHtml({ sprintLabel, passRate, statusColor, status: run.status, duration, startedAt, s, ci, screenshot, dashboardUrl })
  const plainText  = buildPlainText({ sprintLabel, passRate, status: run.status, duration, s, ci, dashboardUrl })

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
    const subject = encodeURIComponent(`Test Report — ${sprintLabel}`)
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

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Copy to clipboard and paste into Outlook — screenshot and formatting are preserved.
              </p>
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={emailHtml}
                  title="Email preview"
                  className="w-full"
                  style={{ height: 440, border: 'none' }}
                  sandbox="allow-same-origin"
                />
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
