const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'])
const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'SECTION',
  'ARTICLE',
  'LI',
  'BLOCKQUOTE',
  'PRE',
  'TABLE',
  'UL',
  'OL',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HR',
])

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function getInlineText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }

  const el = node as HTMLElement
  const tag = el.tagName

  if (tag === 'BR') return '\n'

  if (tag === 'STRONG' || tag === 'B') {
    const inner = Array.from(el.childNodes).map((child) => getInlineText(child)).join('')
    const trimmed = inner.replace(/\s+/g, ' ').trim()
    return trimmed ? `**${trimmed}**` : ''
  }

  if (tag === 'TD' || tag === 'TH') {
    const inner = Array.from(el.childNodes).map((child) => getInlineText(child)).join('')
    return normalizeWhitespace(inner)
  }

  let text = ''
  for (const child of Array.from(el.childNodes)) {
    text += getInlineText(child)
  }

  if (tag === 'LI') return text
  if (BLOCK_TAGS.has(tag)) return text

  return text
}

function getBlockText(el: Element): string {
  return collapseBlankLines(
    Array.from(el.childNodes)
      .map((child) => getInlineText(child))
      .join('')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\s+\*\*/g, ' **')
      .replace(/\*\*\s+/g, '** '),
  )
}

function headingPrefix(tagName: string): string {
  const level = Number(tagName.slice(1))
  return '#'.repeat(Math.min(Math.max(level, 1), 6))
}

function formatHtmlTable(table: HTMLTableElement): string {
  const rows = Array.from(table.querySelectorAll('tr'))
    .map((row) =>
      Array.from(row.querySelectorAll('th, td')).map((cell) =>
        normalizeWhitespace(cell.textContent ?? ''),
      ),
    )
    .filter((row) => row.some((cell) => cell.length > 0))

  if (rows.length === 0) return ''

  const columnCount = Math.max(...rows.map((row) => row.length))
  const normalizedRows = rows.map((row) => {
    const next = [...row]
    while (next.length < columnCount) next.push('')
    return next
  })

  const lines = normalizedRows.map((row) => `| ${row.join(' | ')} |`)
  const divider = `| ${Array(columnCount).fill('---').join(' | ')} |`

  if (lines.length === 1) {
    return `${lines[0]}\n${divider}`
  }

  const [header, ...body] = lines
  return [header, divider, ...body].join('\n')
}

function formatHtmlList(list: HTMLElement): string {
  const ordered = list.tagName === 'OL'
  return Array.from(list.children)
    .filter((child) => child.tagName === 'LI')
    .map((item, index) => {
      const text = getBlockText(item)
      return ordered ? `${index + 1}. ${text}` : `- ${text}`
    })
    .join('\n')
}

function formatHtmlNode(node: Node): string[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeWhitespace(node.textContent ?? '')
    return text ? [text] : []
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return []

  const el = node as HTMLElement
  const tag = el.tagName

  if (tag === 'SCRIPT' || tag === 'STYLE') return []

  if (HEADING_TAGS.has(tag)) {
    const text = getBlockText(el)
    return text ? [`${headingPrefix(tag)} ${text}`] : []
  }

  if (tag === 'P') {
    const text = getBlockText(el)
    return text ? [text] : []
  }

  if (tag === 'TABLE') {
    const table = formatHtmlTable(el as HTMLTableElement)
    return table ? [table] : []
  }

  if (tag === 'UL' || tag === 'OL') {
    const list = formatHtmlList(el)
    return list ? [list] : []
  }

  if (tag === 'BLOCKQUOTE') {
    const text = getBlockText(el)
    return text
      ? text
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n')
          .split('\n')
      : []
  }

  if (tag === 'PRE' || tag === 'CODE') {
    const text = el.textContent?.trim() ?? ''
    return text ? [`\`\`\`\n${text}\n\`\`\``] : []
  }

  if (tag === 'HR') return ['---']

  if (tag === 'BR') return ['']

  if (tag === 'LI') {
    const text = getBlockText(el)
    return text ? [`- ${text}`] : []
  }

  const childBlocks = Array.from(el.childNodes).flatMap((child) =>
    formatHtmlNode(child),
  )

  if (childBlocks.length > 0) return childBlocks

  const fallback = getBlockText(el)
  return fallback ? [fallback] : []
}

export function formatFromHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const blocks = Array.from(doc.body.childNodes).flatMap((node) =>
    formatHtmlNode(node),
  )

  return collapseBlankLines(blocks.filter(Boolean).join('\n\n'))
}

function isTableRow(line: string): boolean {
  if (line.includes('|') && line.split('|').filter(Boolean).length >= 2) {
    return true
  }

  if (line.includes('\t')) {
    return line.split('\t').filter((part) => part.trim()).length >= 2
  }

  const spacedColumns = line
    .split(/\s{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)

  return spacedColumns.length >= 3
}

function parseTableRow(line: string): string[] {
  if (line.includes('|')) {
    return line
      .split('|')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
  }

  if (line.includes('\t')) {
    return line.split('\t').map((part) => part.trim()).filter(Boolean)
  }

  return line
    .split(/\s{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function formatPlainTable(lines: string[]): string {
  const rows = lines.map(parseTableRow)
  const columnCount = Math.max(...rows.map((row) => row.length))
  const normalizedRows = rows.map((row) => {
    const next = [...row]
    while (next.length < columnCount) next.push('')
    return next
  })

  const rendered = normalizedRows.map((row) => `| ${row.join(' | ')} |`)
  const divider = `| ${Array(columnCount).fill('---').join(' | ')} |`
  const [header, ...body] = rendered
  return [header, divider, ...body].join('\n')
}

function looksLikeHeading(line: string, nextLine?: string): boolean {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 90) return false
  if (/^#{1,6}\s/.test(trimmed)) return true
  if (/[.!?:;]$/.test(trimmed)) return false
  if (/^[-*•]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) return false
  if (/^\|?.+\|.+\|?$/.test(trimmed)) return false

  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return true
  }

  if (nextLine && nextLine.trim() && trimmed.length <= 60) {
    return true
  }

  return false
}

function formatPlainText(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (isTableRow(trimmed)) {
      const tableLines: string[] = []
      while (index < lines.length) {
        const candidate = lines[index].trim()
        if (!candidate) break
        if (!isTableRow(candidate) && tableLines.length > 0) break
        if (!isTableRow(candidate)) break
        tableLines.push(lines[index])
        index += 1
      }
      if (tableLines.length > 0) {
        blocks.push(formatPlainTable(tableLines))
      }
      continue
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const listLines: string[] = []
      while (index < lines.length) {
        const candidate = lines[index].trim()
        if (!candidate) break
        if (!/^[-*•]\s+/.test(candidate)) break
        listLines.push(candidate.replace(/^[-*•]\s+/, ''))
        index += 1
      }
      blocks.push(listLines.map((item) => `- ${item}`).join('\n'))
      continue
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const listLines: string[] = []
      let number = 1
      while (index < lines.length) {
        const candidate = lines[index].trim()
        if (!candidate) break
        const match = candidate.match(/^\d+[.)]\s+(.*)$/)
        if (!match) break
        listLines.push(`${number}. ${match[1]}`)
        number += 1
        index += 1
      }
      blocks.push(listLines.join('\n'))
      continue
    }

    if (looksLikeHeading(trimmed, lines[index + 1])) {
      blocks.push(`## ${trimmed}`)
      index += 1
      continue
    }

    const paragraphLines = [trimmed]
    index += 1
    while (index < lines.length) {
      const candidate = lines[index].trim()
      if (!candidate) break
      if (
        looksLikeHeading(candidate, lines[index + 1]) ||
        isTableRow(candidate) ||
        /^[-*•]\s+/.test(candidate) ||
        /^\d+[.)]\s+/.test(candidate)
      ) {
        break
      }
      paragraphLines.push(candidate)
      index += 1
    }

    blocks.push(paragraphLines.join(' '))
  }

  return collapseBlankLines(blocks.join('\n\n'))
}

export function formatCapture(
  html?: string | null,
  plainText?: string | null,
): string {
  if (html?.trim()) {
    const formatted = formatFromHtml(html)
    if (formatted) return formatted
  }

  if (plainText?.trim()) {
    return formatPlainText(plainText.trim())
  }

  return ''
}
