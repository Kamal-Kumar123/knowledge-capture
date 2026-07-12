import { createDefaultState } from '../lib/storage'

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get('appState')
  if (!result.appState) {
    await chrome.storage.local.set({ appState: createDefaultState() })
  }
})
