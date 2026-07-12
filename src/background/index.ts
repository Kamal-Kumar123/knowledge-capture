import { createDefaultState } from '../lib/storage'
import { appendCaptureToGoogleDoc } from '../lib/google/sync'

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

async function ensureDefaultState() {
  const result = await chrome.storage.local.get('appState')
  if (!result.appState) {
    await chrome.storage.local.set({ appState: createDefaultState() })
  }
}

async function injectIntoOpenTabs() {
  const manifest = chrome.runtime.getManifest()
  const contentScript = manifest.content_scripts?.[0]
  if (!contentScript?.js?.length) return

  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue
    if (
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:')
    ) {
      continue
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [...contentScript.js],
      })
    } catch {
      // Restricted pages (Chrome Web Store, PDF viewer, etc.)
    }
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  await ensureDefaultState()
  if (details.reason === 'install' || details.reason === 'update') {
    await injectIntoOpenTabs()
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'APPEND_GOOGLE_DOC') {
    appendCaptureToGoogleDoc(message.documentId, message.text)
      .then(() => sendResponse({ ok: true }))
      .catch((err: unknown) =>
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : 'Google sync failed',
        }),
      )
    return true
  }
})
