import {
  GOOGLE_EXTENSION_REDIRECT_URI,
  GOOGLE_SCOPES,
  GOOGLE_WEB_CLIENT_ID,
} from './config'

const GOOGLE_AUTH_STORAGE_KEY = 'googleAuth'

interface StoredGoogleAuth {
  token: string
  expiresAt: number
  email?: string
}

function parseTokenFromRedirect(responseUrl: string): {
  token: string
  expiresAt: number
} {
  const params = new URLSearchParams(new URL(responseUrl).hash.slice(1))
  const token = params.get('access_token')
  const expiresIn = Number(params.get('expires_in') ?? '3600')

  if (!token) {
    const error = params.get('error_description') ?? params.get('error')
    throw new Error(error ?? 'Google sign-in was cancelled')
  }

  return {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

async function readStoredAuth(): Promise<StoredGoogleAuth | null> {
  const { [GOOGLE_AUTH_STORAGE_KEY]: stored } =
    await chrome.storage.local.get(GOOGLE_AUTH_STORAGE_KEY)
  if (!stored || typeof stored !== 'object') return null

  const auth = stored as StoredGoogleAuth
  if (!auth.token || !auth.expiresAt) return null
  if (auth.expiresAt <= Date.now()) return null

  return auth
}

async function writeStoredAuth(auth: StoredGoogleAuth): Promise<void> {
  await chrome.storage.local.set({ [GOOGLE_AUTH_STORAGE_KEY]: auth })
}

async function clearStoredAuth(): Promise<void> {
  await chrome.storage.local.remove(GOOGLE_AUTH_STORAGE_KEY)
}

function buildAccountPickerUrl(): string {
  if (GOOGLE_WEB_CLIENT_ID.includes('PASTE_YOUR_WEB_CLIENT_ID')) {
    throw new Error(
      `Add a Web OAuth client in Google Cloud with redirect URI: ${GOOGLE_EXTENSION_REDIRECT_URI}`,
    )
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', GOOGLE_WEB_CLIENT_ID)
  url.searchParams.set('response_type', 'token')
  url.searchParams.set('redirect_uri', chrome.identity.getRedirectURL())
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '))
  url.searchParams.set('prompt', 'select_account')
  url.searchParams.set('include_granted_scopes', 'true')
  return url.toString()
}

async function fetchGoogleEmail(token: string): Promise<string | undefined> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return undefined
  const data = (await res.json()) as { email?: string }
  return data.email
}

export async function getGoogleProfile(): Promise<{
  email: string
  id: string
} | null> {
  try {
    const info = await chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' })
    if (!info.email) return null
    return { email: info.email, id: info.id }
  } catch {
    const stored = await readStoredAuth()
    if (stored?.email) {
      return { email: stored.email, id: '' }
    }
    return null
  }
}

export async function connectGoogleAccount(): Promise<void> {
  await disconnectGoogle()

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: buildAccountPickerUrl(),
    interactive: true,
  })

  if (!responseUrl) {
    throw new Error('Google sign-in was cancelled')
  }

  const { token, expiresAt } = parseTokenFromRedirect(responseUrl)
  const email = await fetchGoogleEmail(token)

  await writeStoredAuth({ token, expiresAt, email })
}

export async function getGoogleAuthToken(
  interactive: boolean,
): Promise<string> {
  const stored = await readStoredAuth()
  if (stored?.token) return stored.token

  if (interactive) {
    await connectGoogleAccount()
    const fresh = await readStoredAuth()
    if (fresh?.token) return fresh.token
    throw new Error('Failed to save Google auth token')
  }

  try {
    const { token } = await chrome.identity.getAuthToken({ interactive: false })
    if (token) return token
  } catch {
    // Fall through to interactive connect.
  }

  if (chrome.runtime.lastError?.message) {
    throw new Error(chrome.runtime.lastError.message)
  }

  throw new Error('Not connected to Google')
}

export async function isGoogleConnected(): Promise<boolean> {
  const stored = await readStoredAuth()
  if (stored?.token) return true

  try {
    const { token } = await chrome.identity.getAuthToken({ interactive: false })
    return Boolean(token)
  } catch {
    return false
  }
}

export async function disconnectGoogle(): Promise<void> {
  const stored = await readStoredAuth()
  if (stored?.token) {
    try {
      await chrome.identity.removeCachedAuthToken({ token: stored.token })
    } catch {
      // Token may only exist in extension storage.
    }
  }

  await clearStoredAuth()
  await chrome.identity.clearAllCachedAuthTokens()
}
