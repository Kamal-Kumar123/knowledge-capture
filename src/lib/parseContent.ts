import { stripHeadingPrefix, stripListPrefix } from './richText'

export type ContentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'code'; text: string }

function isTableDivider(line: string): boolean {
  return /^\|\s*[-:]+(?:\s*\|\s*[-:]+)+\s*\|?$/.test(line.trim())
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.includes('|')
}

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell, index, cells) => {
      if (index === 0 && cell === '') return false
      if (index === cells.length - 1 && cell === '') return false
      return true
    })
}

function parseTableLines(lines: string[]): string[][] {
  return lines
    .filter((line) => !isTableDivider(line))
    .map(parseTableRow)
    .filter((row) => row.length > 0)
}

export function parseContentBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      blocks.push({ type: 'code', text: codeLines.join('\n') })
      continue
    }

    if (isTableRow(trimmed)) {
      const tableLines: string[] = []
      while (index < lines.length) {
        const candidate = lines[index].trim()
        if (!isTableRow(candidate)) break
        tableLines.push(lines[index])
        index += 1
      }
      const rows = parseTableLines(tableLines)
      if (rows.length > 0) {
        blocks.push({ type: 'table', rows })
      }
      continue
    }

    const heading = stripHeadingPrefix(trimmed)
    if (heading.level) {
      blocks.push({ type: 'heading', level: heading.level, text: heading.text })
      index += 1
      continue
    }

    const list = stripListPrefix(trimmed)
    if (list.kind === 'bullet') {
      const items: string[] = []
      while (index < lines.length) {
        const candidate = lines[index].trim()
        const item = stripListPrefix(candidate)
        if (item.kind !== 'bullet') break
        items.push(item.text)
        index += 1
      }
      blocks.push({ type: 'bullet-list', items })
      continue
    }

    if (list.kind === 'numbered') {
      const items: string[] = []
      while (index < lines.length) {
        const candidate = lines[index].trim()
        const item = stripListPrefix(candidate)
        if (item.kind !== 'numbered') break
        items.push(item.text)
        index += 1
      }
      blocks.push({ type: 'numbered-list', items })
      continue
    }

    const paragraphLines = [trimmed]
    index += 1
    while (index < lines.length) {
      const candidate = lines[index].trim()
      if (
        !candidate ||
        candidate.startsWith('```') ||
        isTableRow(candidate) ||
        stripHeadingPrefix(candidate).level ||
        stripListPrefix(candidate).kind
      ) {
        break
      }
      paragraphLines.push(candidate)
      index += 1
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

export function renderInlineHtml(text: string): string {
  const parts: string[] = []
  let lastIndex = 0
  const pattern = /\*\*(.+?)\*\*/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)))
    }
    parts.push(`<strong>${escapeHtml(match[1])}</strong>`)
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)))
  }

  return parts.join('')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
