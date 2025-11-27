import { useState, useEffect } from 'react'
import type { Video } from '../App'
import type { Settings } from '../hooks/useSettings'
import { extractVideoId } from '../utils/url'
import { ListPlus, Play, Search, Loader2 } from 'lucide-react'

interface SearchResultsProps {
  query: string
  onVideoSelect: (videoId: string, title?: string, channelTitle?: string, thumbnail?: string) => void
  onAddToQueue: (video: Video) => void
  settings: Settings
}

// Since we can't directly use YouTube API without a key, we'll show a search prompt
export function SearchResults({ query, onVideoSelect, onAddToQueue, settings }: SearchResultsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Video[]>([])
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)

  useEffect(() => {
    // Check if query is a video URL
    const videoId = extractVideoId(query)
    if (videoId) {
      // Redirect to watch the video directly
      onVideoSelect(videoId, `Video ${videoId}`, '', `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`)
      return
    }

    // For actual search, we would need YouTube Data API
    setIsLoading(true)
    
    // Simulate search with placeholder results
    setTimeout(() => {
      // Generate some placeholder results based on the query
      const placeholderResults: Video[] = [
        {
          id: 'dQw4w9WgXcQ',
          title: `Search result for "${query}" - Video 1`,
          channelTitle: 'Sample Channel',
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          duration: '3:33',
          viewCount: '1M views',
          publishedAt: '1 year ago',
        },
        {
          id: 'jNQXAC9IVRw',
          title: `Search result for "${query}" - Video 2`,
          channelTitle: 'Another Channel',
          thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg',
          duration: '2:45',
          viewCount: '500K views',
          publishedAt: '6 months ago',
        },
      ]
      setResults(placeholderResults)
      setIsLoading(false)
    }, 500)
  }, [query])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={48} className="animate-spin text-gray-400 mb-4" />
        <p className="text-gray-400">Searching for "{query}"...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Search Results for "{query}"</h2>
      
      {/* Direct URL input hint */}
      <div className="bg-youtube-gray rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="text-blue-400" size={20} />
          <div>
            <p className="text-sm text-gray-300">
              <strong>Tip:</strong> Paste a YouTube video URL directly to watch it ad-free!
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: youtube.com/watch?v=xxx, youtu.be/xxx, youtube.com/shorts/xxx
            </p>
          </div>
        </div>
      </div>
      
      {/* Search results */}
      <div className="space-y-4">
        {results.map((video) => (
          <div
            key={video.id}
            className="flex gap-4 p-2 rounded-lg hover:bg-youtube-gray cursor-pointer"
            onMouseEnter={() => setHoveredVideo(video.id)}
            onMouseLeave={() => setHoveredVideo(null)}
          >
            <div 
              className="relative w-64 h-36 flex-shrink-0 rounded-lg overflow-hidden"
              onClick={() => onVideoSelect(video.id, video.title, video.channelTitle, video.thumbnail)}
            >
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
              {video.duration && (
                <span className="video-duration">{video.duration}</span>
              )}
              
              {hoveredVideo === video.id && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onVideoSelect(video.id, video.title, video.channelTitle, video.thumbnail)
                    }}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30"
                  >
                    <Play size={20} fill="white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToQueue(video)
                    }}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30"
                    title="Add to queue"
                  >
                    <ListPlus size={20} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 
                className="font-medium text-lg line-clamp-2 hover:text-blue-400"
                onClick={() => onVideoSelect(video.id, video.title, video.channelTitle, video.thumbnail)}
              >
                {video.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {video.viewCount} • {video.publishedAt}
              </p>
              <p className="text-sm text-gray-400 mt-2">{video.channelTitle}</p>
            </div>
          </div>
        ))}
      </div>
      
      {results.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-4">No results found for "{query}"</p>
          <p className="text-sm">
            Try pasting a YouTube video URL directly in the search bar
          </p>
        </div>
      )}
    </div>
  )
}
