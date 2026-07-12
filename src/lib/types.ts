export interface Document {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface AppState {
  enabled: boolean
  activeDocumentId: string | null
  documents: Document[]
}

export type StorageKey = 'appState'

// Legacy shape for migration from entry-based storage
export interface LegacyCapturedEntry {
  id: string
  text: string
  pageTitle: string
  pageUrl: string
  timestamp: number
}

export interface LegacyNotebook {
  id: string
  name: string
  entries?: LegacyCapturedEntry[]
  content?: string
  createdAt: number
}

export interface LegacyAppState {
  enabled: boolean
  activeNotebookId?: string | null
  activeDocumentId?: string | null
  notebooks?: LegacyNotebook[]
  documents?: Document[]
}
