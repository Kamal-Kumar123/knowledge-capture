import type { JSX } from 'react'
import { parseContentBlocks, renderInlineHtml } from '../../lib/parseContent'

interface FormattedDocumentViewProps {
  content: string
}

function renderTitleBeforeTable(text: string): boolean {
  return text.length <= 100
}

export function FormattedDocumentView({ content }: FormattedDocumentViewProps) {
  const blocks = parseContentBlocks(content)

  if (blocks.length === 0) {
    return (
      <p className="text-gray-400">
        Select text on any webpage and click Save, or start typing in Edit mode...
      </p>
    )
  }

  return (
    <div className="space-y-5 text-[15px] leading-[1.75] text-gray-900">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Tag = `h${Math.min(block.level, 6)}` as keyof JSX.IntrinsicElements
          const sizes: Record<number, string> = {
            1: 'text-3xl font-bold',
            2: 'text-2xl font-bold',
            3: 'text-xl font-semibold',
            4: 'text-lg font-semibold',
            5: 'text-base font-semibold',
            6: 'text-sm font-semibold',
          }
          return (
            <Tag
              key={index}
              className={`${sizes[block.level] ?? sizes[2]} text-gray-900`}
              dangerouslySetInnerHTML={{ __html: renderInlineHtml(block.text) }}
            />
          )
        }

        if (block.type === 'paragraph') {
          const next = blocks[index + 1]
          if (next?.type === 'table' && renderTitleBeforeTable(block.text)) {
            return (
              <h2
                key={index}
                className="text-2xl font-bold text-gray-900"
                dangerouslySetInnerHTML={{ __html: renderInlineHtml(block.text) }}
              />
            )
          }

          return (
            <p
              key={index}
              dangerouslySetInnerHTML={{ __html: renderInlineHtml(block.text) }}
            />
          )
        }

        if (block.type === 'table') {
          const [header, ...body] = block.rows
          return (
            <div key={index} className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-left text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {header.map((cell, cellIndex) => (
                      <th
                        key={cellIndex}
                        className="border border-gray-300 px-4 py-2 font-semibold text-gray-900"
                        dangerouslySetInnerHTML={{ __html: renderInlineHtml(cell) }}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rowIndex) => (
                    <tr key={rowIndex} className="even:bg-gray-50">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="border border-gray-300 px-4 py-2 align-top text-gray-800"
                          dangerouslySetInnerHTML={{ __html: renderInlineHtml(cell) }}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        if (block.type === 'bullet-list') {
          return (
            <ul key={index} className="list-disc space-y-1 pl-6">
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  dangerouslySetInnerHTML={{ __html: renderInlineHtml(item) }}
                />
              ))}
            </ul>
          )
        }

        if (block.type === 'numbered-list') {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-6">
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  dangerouslySetInnerHTML={{ __html: renderInlineHtml(item) }}
                />
              ))}
            </ol>
          )
        }

        return (
          <pre
            key={index}
            className="overflow-x-auto rounded-lg bg-gray-100 p-4 text-sm text-gray-800"
          >
            {block.text}
          </pre>
        )
      })}
    </div>
  )
}
