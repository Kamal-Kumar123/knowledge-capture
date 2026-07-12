import { useEffect, useState } from 'react'
import {
  connectGoogleAccount,
  disconnectGoogle,
  getGoogleProfile,
  isGoogleConnected,
} from '../../lib/google/auth'
import { getGoogleDocUrl } from '../../lib/google/docs'
import { unlinkGoogleDoc } from '../../lib/google/links'
import { createAndLinkGoogleDoc } from '../../lib/google/sync'
import type { Document } from '../../lib/types'

interface GoogleDocsSettingsProps {
  activeDocument: Document | undefined
  onError: (err: unknown) => void
}

export function GoogleDocsSettings({
  activeDocument,
  onError,
}: GoogleDocsSettingsProps) {
  const [connected, setConnected] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshConnection = async () => {
    const isConnected = await isGoogleConnected()
    setConnected(isConnected)
    if (isConnected) {
      const profile = await getGoogleProfile()
      setConnectedEmail(profile?.email ?? null)
    } else {
      setConnectedEmail(null)
    }
  }

  useEffect(() => {
    refreshConnection()
  }, [])

  const handleConnect = async () => {
    setLoading(true)
    try {
      await connectGoogleAccount()
      await refreshConnection()
    } catch (err) {
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchAccount = async () => {
    setLoading(true)
    try {
      await disconnectGoogle()
      await connectGoogleAccount()
      await refreshConnection()
    } catch (err) {
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await disconnectGoogle()
      setConnected(false)
      setConnectedEmail(null)
    } catch (err) {
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async () => {
    if (!activeDocument) return
    setLoading(true)
    try {
      await createAndLinkGoogleDoc(activeDocument.id, activeDocument.name)
    } catch (err) {
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!activeDocument) return
    setLoading(true)
    try {
      await unlinkGoogleDoc(activeDocument.id)
    } catch (err) {
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  const googleDocId = activeDocument?.googleDocId

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="mb-1 text-sm font-medium text-white">Google Docs Sync</p>
      <p className="mb-3 text-xs text-slate-400">
        Optional add-on. Local save always works. Captures also append to a
        linked Google Doc.
      </p>

      <div className="mb-3 rounded-lg bg-slate-800/80 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? 'bg-emerald-400' : 'bg-slate-600'
            }`}
          />
          <span className={connected ? 'text-emerald-400' : 'text-slate-500'}>
            {connected ? 'Google account connected' : 'Not connected'}
          </span>
        </div>
        {connected && connectedEmail && (
          <p className="mt-1 pl-3.5 text-slate-300">{connectedEmail}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {!connected ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-blue-600/50 hover:bg-blue-600/10 hover:text-white disabled:opacity-40"
          >
            <span>🔗</span> Connect Google Account
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSwitchAccount}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-blue-600/50 hover:bg-blue-600/10 hover:text-white disabled:opacity-40"
            >
              <span>👤</span> Switch Google Account
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-slate-600 hover:text-white disabled:opacity-40"
            >
              Disconnect Google
            </button>
          </>
        )}

        {connected && activeDocument && !googleDocId && (
          <button
            type="button"
            onClick={handleLink}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-blue-600/50 hover:bg-blue-600/10 hover:text-white disabled:opacity-40"
          >
            <span>📄</span> Create &amp; Link Google Doc
          </button>
        )}

        {connected && activeDocument && googleDocId && (
          <>
            <a
              href={getGoogleDocUrl(googleDocId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-blue-600/30 bg-blue-600/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition-all hover:bg-blue-600/20"
            >
              <span>↗</span> Open linked Google Doc
            </a>
            <button
              type="button"
              onClick={handleUnlink}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-red-600/50 hover:bg-red-600/10 hover:text-red-300 disabled:opacity-40"
            >
              Unlink Google Doc
            </button>
          </>
        )}
      </div>

      {activeDocument && googleDocId && (
        <p className="mt-2 text-xs text-slate-500">
          Captures to &quot;{activeDocument.name}&quot; also sync to Google Docs.
        </p>
      )}
    </section>
  )
}
