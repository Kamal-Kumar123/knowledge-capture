import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { saveAs } from 'file-saver'

export async function downloadAsDocx(
  name: string,
  content: string,
): Promise<void> {
  const paragraphs =
    content.trim().length > 0
      ? content.split('\n').map(
          (line) =>
            new Paragraph({
              children: [new TextRun(line)],
              spacing: { after: 120 },
            }),
        )
      : [new Paragraph({ children: [new TextRun('')] })]

  const doc = new DocxDocument({
    sections: [{ children: paragraphs }],
  })

  const blob = await Packer.toBlob(doc)
  const safeName = name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'document'
  saveAs(blob, `${safeName}.docx`)
}
