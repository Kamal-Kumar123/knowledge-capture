import { getGoogleAuthToken } from './auth'
import { appendTextToGoogleDoc, createGoogleDoc } from './docs'
import { linkGoogleDoc } from './links'
import { getState } from '../storage'

async function getToken(): Promise<string> {
  try {
    return await getGoogleAuthToken(false)
  } catch {
    return getGoogleAuthToken(true)
  }
}

export async function appendCaptureToGoogleDoc(
  extensionDocumentId: string | null,
  text: string,
): Promise<void> {
  if (!extensionDocumentId) return

  const state = await getState()
  const doc = state.documents.find((d) => d.id === extensionDocumentId)
  if (!doc?.googleDocId) return

  const trimmed = text.trim()
  if (!trimmed) return

  const token = await getToken()
  const separator = '\n\n'
  await appendTextToGoogleDoc(doc.googleDocId, `${separator}${trimmed}`, token)
}

export async function createAndLinkGoogleDoc(
  documentId: string,
  title: string,
): Promise<string> {
  const token = await getToken()
  const googleDocId = await createGoogleDoc(title, token)
  await linkGoogleDoc(documentId, googleDocId)

  const state = await getState()
  const doc = state.documents.find((d) => d.id === documentId)
  if (doc?.content.trim()) {
    await appendTextToGoogleDoc(googleDocId, doc.content, token)
  }

  return googleDocId
}
