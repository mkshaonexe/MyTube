import { useState, useCallback, useEffect } from 'react'
import { getItem, setItem } from '../utils/storage'
import type { Video } from '../App'

const MAX_HISTORY = 100

export function useHistory() {
  const [history, setHistory] = useState<Video[]>(() => 
    getItem('history', [])
  )

  useEffect(() => {
    setItem('history', history)
  }, [history])

  const addToHistory = useCallback((video: Video) => {
    setHistory(prev => {
      // Remove if already exists (to move to front)
      const filtered = prev.filter(v => v.id !== video.id)
      // Add to front
      const newHistory = [video, ...filtered]
      // Limit to max
      return newHistory.slice(0, MAX_HISTORY)
    })
  }, [])

  const removeFromHistory = useCallback((videoId: string) => {
    setHistory(prev => prev.filter(v => v.id !== videoId))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
}
