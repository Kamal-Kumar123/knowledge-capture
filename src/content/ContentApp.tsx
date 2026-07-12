import { useCallback, useEffect, useRef, useState } from 'react'
import { saveEntry } from '../lib/storage'
import { useAppState } from '../lib/useAppState'
import { EditModal } from './components/EditModal'
import { SelectionPopup } from './components/SelectionPopup'
import { Toast } from './components/Toast'

type View = 'popup' | 'edit' | 'toast' | 'hidden'

function getSelectionPosition(): { top: number; left: number } | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null
  }

  const range = selection.getRangeAt(0)
  const rects = range.getClientRects()

  if (rects.length > 0) {
    const lastRect = rects[rects.length - 1]
    return {
      top: lastRect.bottom,
      left: lastRect.left + lastRect.width / 2,
    }
  }

  const rect = range.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null

  return {
    top: rect.bottom,
    left: rect.left + rect.width / 2,
  }
}

function getSelectedText(): string {
  const selection = window.getSelection()
  return selection?.toString().trim() ?? ''
}

export function ContentApp() {
  const state = useAppState()
  const enabledRef = useRef(true)
  const [view, setView] = useState<View>('hidden')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [selectedText, setSelectedText] = useState('')
  const [editText, setEditText] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    setView('hidden')
    setSelectedText('')
  }, [])

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      setToastMessage(message)
      setToastType(type)
      setView('toast')
      const duration = type === 'error' ? 3500 : 2500
      toastTimer.current = setTimeout(() => {
        if (type === 'error') {
          setView('popup')
        } else {
          setView('hidden')
          setToastMessage('')
        }
      }, duration)
    },
    [],
  )

  const handleSave = useCallback(
    async (text: string) => {
      try {
        const { documentName, state } = await saveEntry(
          text,
          document.title,
          window.location.href,
        )
        window.getSelection()?.removeAllRanges()
        showToast(`Saved to ${documentName}`, 'success')
        chrome.runtime.sendMessage({
          type: 'APPEND_GOOGLE_DOC',
          documentId: state.activeDocumentId,
          text: text.trim(),
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Save failed. Please try again.'
        showToast(message, 'error')
      }
    },
    [showToast],
  )

  useEffect(() => {
    enabledRef.current = state?.enabled ?? false
    if (state && !state.enabled) dismiss()
  }, [state?.enabled, state, dismiss])

  useEffect(() => {
    const showPopupForSelection = () => {
      if (!enabledRef.current) return

      requestAnimationFrame(() => {
        const text = getSelectedText()
        if (!text) {
          dismiss()
          return
        }

        const pos = getSelectionPosition()
        if (!pos) return

        setSelectedText(text)
        setPosition(pos)
        setView('popup')
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      const path = e.composedPath()
      if (
        path.some(
          (el) => el instanceof HTMLElement && el.id === 'kc-capture-host',
        )
      ) {
        return
      }

      showPopupForSelection()
    }

    const handleKeyUp = () => {
      if (!enabledRef.current) return
      const text = getSelectedText()
      if (!text) dismiss()
    }

    document.addEventListener('mouseup', handleMouseUp, true)
    document.addEventListener('keyup', handleKeyUp, true)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp, true)
      document.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [dismiss])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  if (state === null || !state.enabled) return null

  return (
    <>
      {view === 'popup' && (
        <SelectionPopup
          position={position}
          onEdit={() => {
            setEditText(selectedText)
            setView('edit')
          }}
          onSave={() => handleSave(selectedText)}
          onCancel={dismiss}
        />
      )}
      {view === 'edit' && (
        <EditModal
          initialText={editText}
          onSave={(text) => handleSave(text)}
          onCancel={() => setView('popup')}
        />
      )}
      {view === 'toast' && (
        <Toast message={toastMessage} type={toastType} />
      )}
    </>
  )
}
