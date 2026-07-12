import { getState, saveState } from '../storage'

export async function linkGoogleDoc(
  documentId: string,
  googleDocId: string,
): Promise<void> {
  const state = await getState()
  const updated = {
    ...state,
    documents: state.documents.map((doc) =>
      doc.id === documentId ? { ...doc, googleDocId } : doc,
    ),
  }
  await saveState(updated)
}

export async function unlinkGoogleDoc(documentId: string): Promise<void> {
  const state = await getState()
  const updated = {
    ...state,
    documents: state.documents.map((doc) => {
      if (doc.id !== documentId) return doc
      const { googleDocId: _, ...rest } = doc
      return rest
    }),
  }
  await saveState(updated)
}
