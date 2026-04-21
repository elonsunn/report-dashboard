/**
 * Copy plain text to clipboard.
 * Tries the modern Clipboard API first; falls back to execCommand for
 * non-secure contexts (HTTP on a LAN IP where navigator.clipboard is undefined).
 */
export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;opacity:0;pointer-events:none;'
  document.body.appendChild(el)
  el.focus()
  el.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(el)
  if (!ok) throw new Error('execCommand copy failed')
}

/**
 * Copy rich HTML to clipboard with a plain-text fallback.
 * Rich copy works only in secure contexts (HTTPS / localhost).
 */
export async function copyHtml(html, plainFallback) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) }),
    ])
    return 'rich'
  } catch {
    await copyText(plainFallback)
    return 'plain'
  }
}
