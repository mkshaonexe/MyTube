import { useState, useCallback, useEffect } from 'react'
import { getItem, setItem } from '../utils/storage'
import type { Video } from '../App'

export function useQueue() {
  const [queue, setQueue] = useState<Video[]>(() => 
    getItem('queue', [])
  )

  useEffect(() => {
    setItem('queue', queue)
  }, [queue])

  const addToQueue = useCallback((video: Video) => {
    setQueue(prev => {
      // Don't add duplicates
      if (prev.some(v => v.id === video.id)) return prev
      return [...prev, video]
    })
  }, [])

  const removeFromQueue = useCallback((videoId: string) => {
    setQueue(prev => prev.filter(v => v.id !== videoId))
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
  }, [])

  const moveInQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev]
      const [removed] = newQueue.splice(fromIndex, 1)
      newQueue.splice(toIndex, 0, removed)
      return newQueue
    })
  }, [])

  const playNext = useCallback((video: Video) => {
    setQueue(prev => {
      const filtered = prev.filter(v => v.id !== video.id)
      return [video, ...filtered]
    })
  }, [])

  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    moveInQueue,
    playNext,
  }
}
