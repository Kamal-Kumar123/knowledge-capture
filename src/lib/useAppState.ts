import { useEffect, useState } from 'react'
import { getState, subscribeToState, createDefaultState } from './storage'
import type { AppState } from './types'

export function useAppState(): AppState | null {
  const [state, setState] = useState<AppState | null>(null)

  useEffect(() => {
    getState()
      .then(setState)
      .catch(() => setState(createDefaultState()))
    return subscribeToState(setState)
  }, [])

  return state
}
