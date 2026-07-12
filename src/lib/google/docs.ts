import { GOOGLE_DOCS_API } from './config'

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
  const res = await fetch(`${GOOGLE_DOCS_API}/${googleDocId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            text,
            endOfSegmentLocation: { segmentId: '' },
          },
        },
      ],
    }),
  })

  if (!res.ok) {
    const detail = await readGoogleApiError(res)
    throw new Error(`Failed to append text to Google Doc: ${detail}`)
  }
}

export function getGoogleDocUrl(googleDocId: string): string {
  return `https://docs.google.com/document/d/${googleDocId}/edit`
}
