import { useCallback, useEffect, useRef, useState } from 'react'
import { updateDocumentContent } from '../../lib/storage'
import type { Document } from '../../lib/types'
import { downloadAsDocx } from '../../lib/docx'
import { FormattedDocumentView } from './FormattedDocumentView'

interface DocumentEditorProps {
  document: Document
}

export function DocumentEditor({ document }: DocumentEditorProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastExternalUpdate = useRef(document.updatedAt)
  const editBaseUpdatedAt = useRef(document.updatedAt)

  const content = draft ?? document.content

  useEffect(() => {
    if (document.updatedAt !== lastExternalUpdate.current) {
      lastExternalUpdate.current = document.updatedAt
      editBaseUpdatedAt.current = document.updatedAt
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      setDraft(null)
    }
  }, [document.content, document.updatedAt])

  const persistContent = useCallback(
    (value: string, expectedUpdatedAt: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const { saved } = await updateDocumentContent(
          document.id,
          value,
          expectedUpdatedAt,
        )
        setDraft(null)
        if (!saved) {
          editBaseUpdatedAt.current = lastExternalUpdate.current
        }
      }, 500)
    },
    [document.id],
  )

  const handleChange = (value: string) => {
    if (draft === null) {
      editBaseUpdatedAt.current = document.updatedAt
    }
    setDraft(value)
    persistContent(value, editBaseUpdatedAt.current)
  }

  const handleExport = () => {
    downloadAsDocx(document.name, content)
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {document.name}
          </p>
          <p className="text-xs text-slate-500">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditMode((value) => !value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-blue-600/50 hover:bg-blue-600/10 hover:text-white"
          >
            {editMode ? 'Preview' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-violet-600/50 hover:bg-violet-600/10 hover:text-white"
          >
            ⬇ .docx
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-800/50 p-4">
        <div className="mx-auto min-h-full max-w-none rounded-sm bg-white shadow-xl">
          {editMode ? (
            <textarea
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Start typing or capture text from a webpage..."
              className="min-h-[calc(100vh-220px)] w-full resize-none bg-white px-8 py-10 text-[15px] leading-[1.75] text-gray-900 outline-none placeholder:text-gray-300"
              spellCheck
            />
          ) : (
            <div className="min-h-[calc(100vh-220px)] px-8 py-10">
              <FormattedDocumentView content={content} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
