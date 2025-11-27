/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(input: string): string | null {
  // Already a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input
  }

  try {
    const url = new URL(input)
    
    // youtube.com/watch?v=xxx
    if (url.hostname.includes('youtube.com')) {
      const videoId = url.searchParams.get('v')
      if (videoId) return videoId
      
      // youtube.com/embed/xxx
      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
      if (embedMatch) return embedMatch[1]
      
      // youtube.com/v/xxx
      const vMatch = url.pathname.match(/\/v\/([a-zA-Z0-9_-]{11})/)
      if (vMatch) return vMatch[1]
      
      // youtube.com/shorts/xxx
      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/)
      if (shortsMatch) return shortsMatch[1]
    }
    
    // youtu.be/xxx
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1)
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id
    }
  } catch {
    // Not a valid URL
  }
  
  return null
}

/**
 * Generate YouTube thumbnail URL
 */
export function getThumbnailUrl(videoId: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'maxresdefault' = 'mqdefault'): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Format duration from seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Format view count to human readable format
 */
export function formatViewCount(count: number): string {
  if (count >= 1000000000) {
    return (count / 1000000000).toFixed(1) + 'B views'
  }
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M views'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K views'
  }
  return count + ' views'
}

/**
 * Format time ago from date
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
    }
  }
  
  return 'Just now'
}
