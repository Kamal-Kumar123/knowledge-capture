import { TextRun } from 'docx'

export interface BoldRange {
  start: number
  end: number
}

export interface ParsedInlineText {
  plain: string
  boldRanges: BoldRange[]
}

const BOLD_PATTERN = /\*\*(.+?)\*\*/g

export function parseInlineMarkdown(text: string): ParsedInlineText {
  const boldRanges: BoldRange[] = []
  let plain = ''
  let index = 0

  while (index < text.length) {
    if (text.startsWith('**', index)) {
      const close = text.indexOf('**', index + 2)
      if (close !== -1) {
        const content = text.slice(index + 2, close)
        const start = plain.length
        plain += content
        if (content.length > 0) {
          boldRanges.push({ start, end: plain.length })
        }
        index = close + 2
        continue
      }
    }

    plain += text[index]
    index += 1
  }

  return { plain, boldRanges }
}

export function buildDocxTextRuns(text: string): TextRun[] {
  const runs: TextRun[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  BOLD_PATTERN.lastIndex = 0
  while ((match = BOLD_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun(text.slice(lastIndex, match.index)))
    }
    runs.push(new TextRun({ text: match[1], bold: true }))
    lastIndex = BOLD_PATTERN.lastIndex
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun(text.slice(lastIndex)))
  }

  return runs.length > 0 ? runs : [new TextRun(text)]
}

export function stripHeadingPrefix(line: string): {
  level: number | null
  text: string
} {
  const match = line.match(/^(#{1,6})\s+(.*)$/)
  if (!match) return { level: null, text: line }
  return { level: match[1].length, text: match[2] }
}

export function stripListPrefix(line: string): {
  kind: 'bullet' | 'numbered' | null
  text: string
} {
  const bullet = line.match(/^[-*•]\s+(.*)$/)
  if (bullet) return { kind: 'bullet', text: bullet[1] }

  const numbered = line.match(/^\d+[.)]\s+(.*)$/)
  if (numbered) return { kind: 'numbered', text: numbered[1] }

  return { kind: null, text: line }
}

export function stripQuotePrefix(line: string): string {
  return line.replace(/^>\s+/, '')
}
