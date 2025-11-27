/**
 * Ad blocking logic - removes ad data from YouTube API responses
 */

const AD_KEYS = ['adBreakHeartbeatParams', 'adPlacements', 'adSlots', 'playerAds']

export const RE_INTERCEPT = /^\/youtubei\/v1\/(player|search)/

/**
 * Transform player response to remove ad data
 */
export function transformPlayerResponse(text: string): string {
  try {
    const data = JSON.parse(text)
    AD_KEYS.forEach((key) => delete data[key])
    return JSON.stringify(data)
  } catch {
    return text
  }
}

/**
 * Transform search response to filter out shorts
 */
export function transformSearchResponse(text: string, hideShorts: boolean = true): string {
  if (!hideShorts) return text
  
  try {
    const data = JSON.parse(text) as SearchResponse
    const sectionListRenderer =
      data.contents?.sectionListRenderer ||
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents.sectionListRenderer
    
    const itemSectionRenderer =
      sectionListRenderer?.contents[0]?.itemSectionRenderer ||
      data.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.itemSectionRenderer

    if (itemSectionRenderer) {
      itemSectionRenderer.contents = itemSectionRenderer.contents
        .filter((item) => !isShorts(item))
    }
    
    return JSON.stringify(data)
  } catch {
    return text
  }
}

function isShorts(item: SectionListItem): boolean {
  const { videoWithContextRenderer, gridShelfViewModel } = item
  if (gridShelfViewModel) return true
  if (videoWithContextRenderer?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url?.startsWith('/shorts')) {
    return true
  }
  return false
}

interface SearchResponse {
  contents?: {
    twoColumnSearchResultsRenderer?: {
      primaryContents: {
        sectionListRenderer?: {
          contents: SectionList[]
        }
      }
    }
    sectionListRenderer?: {
      contents: SectionList[]
    }
  }
  onResponseReceivedCommands?: {
    appendContinuationItemsAction?: {
      continuationItems?: SectionList[]
    }
  }[]
}

interface SectionList {
  itemSectionRenderer?: {
    contents: SectionListItem[]
  }
}

interface SectionListItem {
  videoWithContextRenderer?: {
    navigationEndpoint?: {
      commandMetadata?: {
        webCommandMetadata?: {
          url?: string
        }
      }
    }
  }
  gridShelfViewModel?: unknown
}
