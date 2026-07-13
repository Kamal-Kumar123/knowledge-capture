import { GOOGLE_DOCS_API } from './config'
import { parseContentBlocks, type ContentBlock } from '../parseContent'
import { parseInlineMarkdown } from '../richText'

async function readGoogleApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: { message?: string; status?: string }
    }
    const message = data.error?.message
    if (message) return message
  } catch {
    // Fall back to status text below.
  }
  return res.statusText || `HTTP ${res.status}`
}

const HEADING_STYLES = [
  'HEADING_1',
  'HEADING_2',
  'HEADING_3',
  'HEADING_4',
  'HEADING_5',
  'HEADING_6',
] as const

interface GoogleDocument {
  body?: {
    content?: Array<{
      startIndex?: number
      endIndex?: number
      table?: {
        tableRows?: Array<{
          tableCells?: Array<{
            content?: Array<{
              startIndex?: number
              endIndex?: number
            }>
          }>
        }>
      }
    }>
  }
}

async function getGoogleDocument(
  googleDocId: string,
  token: string,
): Promise<GoogleDocument> {
  const res = await fetch(`${GOOGLE_DOCS_API}/${googleDocId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const detail = await readGoogleApiError(res)
    throw new Error(`Failed to read Google Doc: ${detail}`)
  }

  return (await res.json()) as GoogleDocument
}

async function getDocumentEndIndex(
  googleDocId: string,
  token: string,
): Promise<number> {
  const doc = await getGoogleDocument(googleDocId, token)
  const content = doc.body?.content ?? []
  if (content.length === 0) return 1

  const last = content[content.length - 1]
  return Math.max((last.endIndex ?? 1) - 1, 1)
}

async function batchUpdateGoogleDoc(
  googleDocId: string,
  token: string,
  requests: Array<Record<string, unknown>>,
): Promise<void> {
  if (requests.length === 0) return

  const res = await fetch(`${GOOGLE_DOCS_API}/${googleDocId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  })

  if (!res.ok) {
    const detail = await readGoogleApiError(res)
    throw new Error(`Failed to update Google Doc: ${detail}`)
  }
}

function findLastTable(doc: GoogleDocument) {
  const content = doc.body?.content ?? []
  for (let index = content.length - 1; index >= 0; index -= 1) {
    if (content[index]?.table) return content[index]?.table
  }
  return null
}

async function insertStyledParagraph(
  googleDocId: string,
  token: string,
  text: string,
  headingLevel: number | null,
): Promise<void> {
  const parsed = parseInlineMarkdown(text)
  const plain = `${parsed.plain}\n`
  const insertIndex = await getDocumentEndIndex(googleDocId, token)
  const requests: Array<Record<string, unknown>> = [
    {
      insertText: {
        text: plain,
        location: { index: insertIndex },
      },
    },
  ]

  if (headingLevel) {
    const style = HEADING_STYLES[Math.min(headingLevel, 6) - 1]
    requests.push({
      updateParagraphStyle: {
        range: {
          startIndex: insertIndex,
          endIndex: insertIndex + plain.length,
        },
        paragraphStyle: { namedStyleType: style },
        fields: 'namedStyleType',
      },
    })
  }

  for (const range of parsed.boldRanges) {
    if (range.start >= range.end) continue
    requests.push({
      updateTextStyle: {
        range: {
          startIndex: insertIndex + range.start,
          endIndex: insertIndex + range.end,
        },
        textStyle: { bold: true },
        fields: 'bold',
      },
    })
  }

  await batchUpdateGoogleDoc(googleDocId, token, requests)
}

async function insertGoogleTable(
  googleDocId: string,
  token: string,
  rows: string[][],
): Promise<void> {
  const rowCount = rows.length
  const colCount = Math.max(...rows.map((row) => row.length), 1)
  const insertIndex = await getDocumentEndIndex(googleDocId, token)

  await batchUpdateGoogleDoc(googleDocId, token, [
    {
      insertTable: {
        rows: rowCount,
        columns: colCount,
        location: { index: insertIndex },
      },
    },
  ])

  const doc = await getGoogleDocument(googleDocId, token)
  const table = findLastTable(doc)
  if (!table?.tableRows) return

  const cellInserts: Array<{
    index: number
    plain: string
    boldRanges: Array<{ start: number; end: number }>
  }> = []

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const tableRow = table.tableRows[rowIndex]
    if (!tableRow?.tableCells) continue

    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const cell = tableRow.tableCells[colIndex]
      const cellStart = cell?.content?.[0]?.startIndex
      if (cellStart === undefined) continue

      const rawText = rows[rowIndex]?.[colIndex] ?? ''
      const parsed = parseInlineMarkdown(rawText)
      cellInserts.push({
        index: cellStart,
        plain: parsed.plain,
        boldRanges: parsed.boldRanges,
      })
    }
  }

  cellInserts.sort((a, b) => b.index - a.index)

  const insertRequests = cellInserts.map((cell) => ({
    insertText: {
      text: cell.plain,
      location: { index: cell.index },
    },
  }))

  await batchUpdateGoogleDoc(googleDocId, token, insertRequests)

  const styleRequests: Array<Record<string, unknown>> = []
  for (const cell of cellInserts) {
    for (const range of cell.boldRanges) {
      if (range.start >= range.end) continue
      styleRequests.push({
        updateTextStyle: {
          range: {
            startIndex: cell.index + range.start,
            endIndex: cell.index + range.end,
          },
          textStyle: { bold: true },
          fields: 'bold',
        },
      })
    }
  }

  const headerRow = table.tableRows[0]
  if (headerRow?.tableCells) {
    for (const cell of headerRow.tableCells) {
      const start = cell.content?.[0]?.startIndex
      const end = cell.content?.[0]?.endIndex
      if (start === undefined || end === undefined) continue
      styleRequests.push({
        updateTextStyle: {
          range: { startIndex: start, endIndex: end },
          textStyle: { bold: true },
          fields: 'bold',
        },
      })
    }
  }

  await batchUpdateGoogleDoc(googleDocId, token, styleRequests)
}

async function appendBlockToGoogleDoc(
  googleDocId: string,
  token: string,
  block: ContentBlock,
  nextBlock?: ContentBlock,
): Promise<void> {
  if (block.type === 'table') {
    await insertGoogleTable(googleDocId, token, block.rows)
    return
  }

  if (block.type === 'heading') {
    await insertStyledParagraph(googleDocId, token, block.text, block.level)
    return
  }

  if (block.type === 'paragraph') {
    const headingLevel =
      nextBlock?.type === 'table' && block.text.length <= 100 ? 2 : null
    await insertStyledParagraph(googleDocId, token, block.text, headingLevel)
    return
  }

  if (block.type === 'bullet-list') {
    for (const item of block.items) {
      const parsed = parseInlineMarkdown(item)
      const insertIndex = await getDocumentEndIndex(googleDocId, token)
      const plain = `• ${parsed.plain}\n`
      const requests: Array<Record<string, unknown>> = [
        {
          insertText: {
            text: plain,
            location: { index: insertIndex },
          },
        },
      ]

      for (const range of parsed.boldRanges) {
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: insertIndex + 2 + range.start,
              endIndex: insertIndex + 2 + range.end,
            },
            textStyle: { bold: true },
            fields: 'bold',
          },
        })
      }

      await batchUpdateGoogleDoc(googleDocId, token, requests)
    }
    return
  }

  if (block.type === 'numbered-list') {
    for (const [index, item] of block.items.entries()) {
      const parsed = parseInlineMarkdown(item)
      const insertIndex = await getDocumentEndIndex(googleDocId, token)
      const prefix = `${index + 1}. `
      const plain = `${prefix}${parsed.plain}\n`
      const requests: Array<Record<string, unknown>> = [
        {
          insertText: {
            text: plain,
            location: { index: insertIndex },
          },
        },
      ]

      for (const range of parsed.boldRanges) {
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: insertIndex + prefix.length + range.start,
              endIndex: insertIndex + prefix.length + range.end,
            },
            textStyle: { bold: true },
            fields: 'bold',
          },
        })
      }

      await batchUpdateGoogleDoc(googleDocId, token, requests)
    }
    return
  }

  await insertStyledParagraph(googleDocId, token, block.text, null)
}

export async function createGoogleDoc(
  title: string,
  token: string,
): Promise<string> {
  const res = await fetch(GOOGLE_DOCS_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  })

  if (!res.ok) {
    const detail = await readGoogleApiError(res)
    throw new Error(`Failed to create Google Doc: ${detail}`)
  }

  const data = (await res.json()) as { documentId: string }
  return data.documentId
}

export async function appendTextToGoogleDoc(
  googleDocId: string,
  text: string,
  token: string,
): Promise<void> {
  const blocks = parseContentBlocks(text)
  if (blocks.length === 0) return

  for (let index = 0; index < blocks.length; index += 1) {
    await appendBlockToGoogleDoc(
      googleDocId,
      token,
      blocks[index],
      blocks[index + 1],
    )
  }
}

export function getGoogleDocUrl(googleDocId: string): string {
  return `https://docs.google.com/document/d/${googleDocId}/edit`
}
