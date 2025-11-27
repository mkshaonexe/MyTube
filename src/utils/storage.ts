/**
 * Local storage utilities with type safety
 */

const STORAGE_PREFIX = 'noutube:'

export function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    if (item === null) return fallback
    return JSON.parse(item) as T
  } catch {
    return fallback
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error('Storage error:', error)
  }
}

export function removeItem(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key)
}

/**
 * Video progress storage
 */
export function getVideoProgress(videoId: string): number | null {
  const progress = getItem<number | null>(`progress:${videoId}`, null)
  return progress
}

export function setVideoProgress(videoId: string, time: number): void {
  setItem(`progress:${videoId}`, time)
  
  // Track which videos have progress saved (limit to 100)
  const videos = getItem<string[]>('videos:progress', [])
  if (!videos.includes(videoId)) {
    videos.push(videoId)
    if (videos.length > 100) {
      const oldVideo = videos.shift()
      if (oldVideo) removeItem(`progress:${oldVideo}`)
    }
    setItem('videos:progress', videos)
  }
}

export function clearVideoProgress(videoId: string): void {
  removeItem(`progress:${videoId}`)
  const videos = getItem<string[]>('videos:progress', [])
  const index = videos.indexOf(videoId)
  if (index > -1) {
    videos.splice(index, 1)
    setItem('videos:progress', videos)
  }
}
