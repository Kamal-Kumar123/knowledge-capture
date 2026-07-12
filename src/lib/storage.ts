import { DEFAULT_DOCUMENT_NAME, STORAGE_KEY } from './constants'
import type {
  AppState,
  Document,
  LegacyAppState,
  LegacyNotebook,
} from './types'

function generateId(): string {
  return crypto.randomUUID()
}

function createDefaultDocument(): Document {
  const now = Date.now()
  return {
    id: generateId(),
    name: DEFAULT_DOCUMENT_NAME,
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}

function migrateLegacyNotebook(notebook: LegacyNotebook): Document {
  if (notebook.content !== undefined) {
    return {
      id: notebook.id,
      name: notebook.name,
      content: notebook.content,
      createdAt: notebook.createdAt,
      updatedAt: Date.now(),
    }
  }

  const content = (notebook.entries ?? [])
    .slice()
    .reverse()
    .map((entry) => entry.text)
    .join('\n\n')

  return {
    id: notebook.id,
    name: notebook.name,
    content,
    createdAt: notebook.createdAt,
    updatedAt: Date.now(),
  }
}

function migrateState(raw: LegacyAppState): AppState {
  if (raw.documents?.length) {
    return {
      enabled: raw.enabled ?? true,
      activeDocumentId:
        raw.activeDocumentId ??
        raw.activeNotebookId ??
        raw.documents[0]?.id ??
        null,
      documents: raw.documents,
    }
  }

  const legacyNotebooks = raw.notebooks ?? []
  const documents = legacyNotebooks.map(migrateLegacyNotebook)

  if (!documents.length) {
    const doc = createDefaultDocument()
    return {
      enabled: raw.enabled ?? true,
      activeDocumentId: doc.id,
      documents: [doc],
    }
  }

  const activeId =
    raw.activeNotebookId &&
    documents.some((d) => d.id === raw.activeNotebookId)
      ? raw.activeNotebookId
      : documents[0].id

  return {
    enabled: raw.enabled ?? true,
    activeDocumentId: activeId,
    documents,
  }
}

export function createDefaultState(): AppState {
  const document = createDefaultDocument()
  return {
    enabled: true,
    activeDocumentId: document.id,
    documents: [document],
  }
}

function needsMigration(raw: LegacyAppState): boolean {
  return (
    !raw.documents?.length ||
    !!raw.notebooks?.length ||
    raw.activeNotebookId !== undefined
  )
}

export async function getState(): Promise<AppState> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const raw = result[STORAGE_KEY] as LegacyAppState | undefined

  if (!raw) {
    const defaultState = createDefaultState()
    await saveState(defaultState)
    return defaultState
  }

  const state = migrateState(raw)
  if (needsMigration(raw)) {
    await saveState(state)
  }
  return state
}

export async function saveState(state: AppState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state })
}

export async function setEnabled(enabled: boolean): Promise<AppState> {
  const state = await getState()
  state.enabled = enabled
  await saveState(state)
  return state
}

export async function setActiveDocument(
  documentId: string,
): Promise<AppState> {
  const state = await getState()
  if (!state.documents.some((d) => d.id === documentId)) {
    throw new Error('Document not found')
  }
  state.activeDocumentId = documentId
  await saveState(state)
  return state
}

export async function createDocument(name: string): Promise<AppState> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Document name cannot be empty')

  const state = await getState()
  const now = Date.now()
  const document: Document = {
    id: generateId(),
    name: trimmed,
    content: '',
    createdAt: now,
    updatedAt: now,
  }
  state.documents.push(document)
  state.activeDocumentId = document.id
  await saveState(state)
  return state
}

export async function renameDocument(
  documentId: string,
  name: string,
): Promise<AppState> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Document name cannot be empty')

  const state = await getState()
  const document = state.documents.find((d) => d.id === documentId)
  if (!document) throw new Error('Document not found')

  document.name = trimmed
  document.updatedAt = Date.now()
  await saveState(state)
  return state
}

export async function deleteDocument(
  documentId: string,
): Promise<AppState> {
  const state = await getState()
  if (state.documents.length <= 1) {
    throw new Error('Cannot delete the last document')
  }

  state.documents = state.documents.filter((d) => d.id !== documentId)
  if (state.activeDocumentId === documentId) {
    state.activeDocumentId = state.documents[0]?.id ?? null
  }
  await saveState(state)
  return state
}

export async function updateDocumentContent(
  documentId: string,
  content: string,
): Promise<AppState> {
  const state = await getState()
  const document = state.documents.find((d) => d.id === documentId)
  if (!document) throw new Error('Document not found')

  document.content = content
  document.updatedAt = Date.now()
  await saveState(state)
  return state
}

export async function appendToDocument(
  text: string,
  _pageTitle: string,
  _pageUrl: string,
): Promise<{ state: AppState; documentName: string }> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const raw = result[STORAGE_KEY] as LegacyAppState | undefined
  if (!raw) throw new Error('No state found')

  const state = migrateState(raw)
  const docId =
    state.activeDocumentId ?? state.documents[0]?.id ?? null
  if (!docId) throw new Error('No active document selected')

  const trimmed = text.trim()
  if (!trimmed) throw new Error('Cannot save empty text')

  const now = Date.now()
  const updatedState: AppState = {
    ...state,
    documents: state.documents.map((doc) => {
      if (doc.id !== docId) return doc
      const separator = doc.content.trim() ? '\n\n' : ''
      return {
        ...doc,
        content: doc.content + separator + trimmed,
        updatedAt: now,
      }
    }),
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: updatedState })

  const saved = updatedState.documents.find((d) => d.id === docId)
  return { state: updatedState, documentName: saved?.name ?? 'Document' }
}

// Keep alias for content script compatibility
export const saveEntry = appendToDocument

// Legacy aliases for gradual rename in UI imports
export const createNotebook = createDocument
export const renameNotebook = renameDocument
export const deleteNotebook = deleteDocument
export const setActiveNotebook = setActiveDocument

export function subscribeToState(
  callback: (state: AppState) => void,
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) return
    const newState = changes[STORAGE_KEY].newValue as AppState | undefined
    if (newState) callback(migrateState(newState as LegacyAppState))
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
