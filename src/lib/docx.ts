import {
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { saveAs } from 'file-saver'
import { parseContentBlocks, type ContentBlock } from './parseContent'
import { buildDocxTextRuns } from './richText'

function headingLevel(level: number) {
  const levels = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ] as const

  return levels[Math.min(level, 6) - 1] ?? HeadingLevel.HEADING_2
}

function buildDocxTable(rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: buildDocxTextRuns(cell),
                  }),
                ],
              }),
          ),
        }),
    ),
  })
}

function buildBlock(
  block: ContentBlock,
  nextBlock?: ContentBlock,
): Paragraph | Table {
  if (block.type === 'table') {
    return buildDocxTable(block.rows)
  }

  if (block.type === 'heading') {
    return new Paragraph({
      children: buildDocxTextRuns(block.text),
      heading: headingLevel(block.level),
      spacing: { after: 160 },
    })
  }

  if (block.type === 'paragraph') {
    if (nextBlock?.type === 'table' && block.text.length <= 100) {
      return new Paragraph({
        children: buildDocxTextRuns(block.text),
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 160 },
      })
    }

    return new Paragraph({
      children: buildDocxTextRuns(block.text),
      spacing: { after: 120 },
    })
  }

  if (block.type === 'bullet-list') {
    return new Paragraph({
      children: buildDocxTextRuns(block.items[0] ?? ''),
      bullet: { level: 0 },
      spacing: { after: 80 },
    })
  }

  if (block.type === 'numbered-list') {
    return new Paragraph({
      children: buildDocxTextRuns(block.items[0] ?? ''),
      numbering: { reference: 'capture-numbering', level: 0 },
      spacing: { after: 80 },
    })
  }

  return new Paragraph({
    children: [new TextRun(block.text)],
    spacing: { after: 120 },
  })
}

function buildDocxBlocks(content: string): Array<Paragraph | Table> {
  const blocks = parseContentBlocks(content)
  const children: Array<Paragraph | Table> = []

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]

    if (block.type === 'bullet-list') {
      for (const item of block.items) {
        children.push(
          new Paragraph({
            children: buildDocxTextRuns(item),
            bullet: { level: 0 },
            spacing: { after: 80 },
          }),
        )
      }
      continue
    }

    if (block.type === 'numbered-list') {
      for (const item of block.items) {
        children.push(
          new Paragraph({
            children: buildDocxTextRuns(item),
            numbering: { reference: 'capture-numbering', level: 0 },
            spacing: { after: 80 },
          }),
        )
      }
      continue
    }

    children.push(buildBlock(block, blocks[index + 1]))

    if (block.type === 'table') {
      children.push(new Paragraph({ children: [new TextRun('')] }))
    }
  }

  return children.length > 0
    ? children
    : [new Paragraph({ children: [new TextRun('')] })]
}

export async function downloadAsDocx(
  name: string,
  content: string,
): Promise<void> {
  const children = buildDocxBlocks(content)

  const doc = new DocxDocument({
    numbering: {
      config: [
        {
          reference: 'capture-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: 'start',
            },
          ],
        },
      ],
    },
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  const safeName = name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'document'
  saveAs(blob, `${safeName}.docx`)
}
