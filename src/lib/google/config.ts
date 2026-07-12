// Chrome Extension type — must match manifest.json → oauth2.client_id
export const GOOGLE_EXTENSION_CLIENT_ID =
  '884860362026-30gkl7ulj6qdmlh6pk4ptalt1u7omqb1.apps.googleusercontent.com'

// Web application type — for account picker (launchWebAuthFlow).
// Google Cloud → Credentials → Create OAuth client → Web application
// Authorized redirect URI:
// https://ghbldhjeolofhafehkjgnpemannlafgj.chromiumapp.org/
export const GOOGLE_WEB_CLIENT_ID =
  '273424879917-h09a91j2ojv8mifvvrekf35ncgfropio.apps.googleusercontent.com'

export const GOOGLE_EXTENSION_REDIRECT_URI =
  'https://ghbldhjeolofhafehkjgnpemannlafgj.chromiumapp.org/'

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
] as const

export const GOOGLE_DOCS_API = 'https://docs.googleapis.com/v1/documents'
