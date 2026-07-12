import { useState } from 'react'
import {
  createDocument,
  deleteDocument,
  renameDocument,
  setActiveDocument,
  setEnabled,
} from '../lib/storage'
import { useAppState } from '../lib/useAppState'
import { DocumentEditor } from './components/DocumentEditor'
import { GoogleDocsSettings } from './components/GoogleDocsSettings'
import { NotebookDialog } from './components/NotebookDialog'
import { NotebookDropdown } from './components/NotebookDropdown'
import { Toggle } from './components/Toggle'

type DialogMode = 'create' | 'rename' | 'delete' | null
type Tab = 'document' | 'settings'

export default function App() {
  const state = useAppState()
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [activeTab, setActiveTab] = useState<Tab>('document')
  const [error, setError] = useState<string | null>(null)

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  const activeDocument = state.documents.find(
    (d) => d.id === state.activeDocumentId,
  )

  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'Something went wrong')
    setTimeout(() => setError(null), 3000)
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="shrink-0 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-lg shadow-lg shadow-violet-900/40">
            📄
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">
              Knowledge Capture
            </h1>
            <p className="text-xs text-slate-400">
              Continuous document capture
            </p>
          </div>
        </div>
      </header>

      <div className="flex shrink-0 border-b border-slate-800 px-5">
        <button
          type="button"
          onClick={() => setActiveTab('document')}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'document'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Document
          {activeTab === 'document' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Settings
          {activeTab === 'settings' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
          )}
        </button>
      </div>

      {activeTab === 'document' && activeDocument && (
        <DocumentEditor document={activeDocument} />
      )}

      {activeTab === 'settings' && (
        <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Capture Enabled</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {state.enabled
                    ? 'Select text on any page to append to document'
                    : 'Capture is paused'}
                </p>
              </div>
              <Toggle
                enabled={state.enabled}
                onChange={(enabled) => setEnabled(enabled).catch(handleError)}
              />
            </div>
            <div
              className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                state.enabled
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  state.enabled
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-600'
                }`}
              />
              {state.enabled ? 'Active on all websites' : 'Inactive'}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="mb-3 text-sm font-medium text-white">
              Active Document
            </p>
            <NotebookDropdown
              notebooks={state.documents.map((d) => ({
                id: d.id,
                name: d.name,
              }))}
              activeNotebookId={state.activeDocumentId}
              onChange={(id) => setActiveDocument(id).catch(handleError)}
            />
            <p className="mt-2 text-xs text-slate-500">
              New captures append to this document continuously
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="mb-3 text-sm font-medium text-white">
              Document Actions
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setDialogMode('create')}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-violet-600/50 hover:bg-violet-600/10 hover:text-white"
              >
                <span>➕</span> Create New Document
              </button>
              <button
                type="button"
                onClick={() => setDialogMode('rename')}
                disabled={!activeDocument}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-violet-600/50 hover:bg-violet-600/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>✏️</span> Rename Document
              </button>
              <button
                type="button"
                onClick={() => setDialogMode('delete')}
                disabled={state.documents.length <= 1}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-red-400 transition-all hover:border-red-600/50 hover:bg-red-600/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>🗑️</span> Delete Document
              </button>
            </div>
          </section>

          <GoogleDocsSettings
            activeDocument={activeDocument}
            onError={handleError}
          />
        </main>
      )}

      {error && (
        <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border border-red-500/30 bg-red-950/90 px-4 py-3 text-sm text-red-300 shadow-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      {dialogMode === 'create' && (
        <NotebookDialog
          title="Create New Document"
          label="Document name"
          confirmLabel="Create"
          onConfirm={(name) => {
            createDocument(name).catch(handleError)
            setDialogMode(null)
            setActiveTab('document')
          }}
          onCancel={() => setDialogMode(null)}
        />
      )}
      {dialogMode === 'rename' && activeDocument && (
        <NotebookDialog
          title="Rename Document"
          label="New name"
          initialValue={activeDocument.name}
          confirmLabel="Rename"
          onConfirm={(name) => {
            renameDocument(activeDocument.id, name).catch(handleError)
            setDialogMode(null)
          }}
          onCancel={() => setDialogMode(null)}
        />
      )}
      {dialogMode === 'delete' && activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h3 className="mb-2 text-base font-semibold text-white">
              Delete Document?
            </h3>
            <p className="mb-5 text-sm text-slate-400">
              This will permanently delete{' '}
              <span className="font-medium text-white">
                {activeDocument.name}
              </span>{' '}
              and all its content.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogMode(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(activeDocument.id).catch(handleError)
                  setDialogMode(null)
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
