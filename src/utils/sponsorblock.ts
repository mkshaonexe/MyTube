/**
 * SponsorBlock integration for skipping sponsored segments
 */

export interface Segment {
  category: string
  actionType: string
  segment: [number, number]
  UUID?: string
}

export interface SkipSegments {
  videoId: string
  segments: Segment[]
}

const SPONSORBLOCK_API = 'https://sponsor.ajay.app/api'

/**
 * Fetch skip segments for a video from SponsorBlock API
 */
export async function getSkipSegments(videoId: string): Promise<SkipSegments> {
  try {
    const res = await fetch(
      `${SPONSORBLOCK_API}/skipSegments?videoID=${videoId}&categories=["sponsor","selfpromo","interaction","intro","outro","preview","music_offtopic"]`
    )
    
    if (res.status === 200) {
      const segments = (await res.json()) as Segment[]
      return { videoId, segments }
    }
  } catch (error) {
    console.error('SponsorBlock error:', error)
  }
  
  return { videoId, segments: [] }
}

/**
 * Check if current time is within a skip segment
 */
export function shouldSkip(currentTime: number, segments: Segment[]): number | null {
  for (const segment of segments) {
    const [start, end] = segment.segment
    if (currentTime >= start && currentTime < end) {
      return end
    }
  }
  return null
}

/**
 * Format segment categories for display
 */
export function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    sponsor: 'Sponsor',
    selfpromo: 'Self Promotion',
    interaction: 'Interaction Reminder',
    intro: 'Intro',
    outro: 'Outro',
    preview: 'Preview',
    music_offtopic: 'Non-Music Section',
  }
  return labels[category] || category
}

/**
 * Get color for segment category
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    sponsor: '#00d400',
    selfpromo: '#ffff00',
    interaction: '#cc00ff',
    intro: '#00ffff',
    outro: '#0202ed',
    preview: '#008fd6',
    music_offtopic: '#ff9900',
  }
  return colors[category] || '#888888'
}
