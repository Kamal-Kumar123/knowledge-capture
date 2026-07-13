export interface SelectionContent {
  text: string
  html: string | null
}

export function getSelectionContent(): SelectionContent | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null
  }

  const text = selection.toString().trim()
  if (!text) return null

  const range = selection.getRangeAt(0)
  const fragment = range.cloneContents()
  const container = document.createElement('div')
  container.appendChild(fragment)

  const html = container.innerHTML.trim() || null
  return { text, html }
}
