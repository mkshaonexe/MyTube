import { useState, useEffect } from 'react'
import type { Video } from '../App'
import type { Settings } from '../hooks/useSettings'
import { ListPlus, Play } from 'lucide-react'

interface VideoGridProps {
  onVideoSelect: (videoId: string, title?: string, channelTitle?: string, thumbnail?: string) => void
  onAddToQueue: (video: Video) => void
  settings: Settings
}

// Sample trending videos - in production, these would come from YouTube API
const SAMPLE_VIDEOS: Video[] = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    channelTitle: 'Rick Astley',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration: '3:33',
    viewCount: '1.5B views',
    publishedAt: '13 years ago',
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'Me at the zoo',
    channelTitle: 'jawed',
    thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg',
    duration: '0:19',
    viewCount: '320M views',
    publishedAt: '19 years ago',
  },
  {
    id: '9bZkp7q19f0',
    title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
    channelTitle: 'officialpsy',
    thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg',
    duration: '4:13',
    viewCount: '5B views',
    publishedAt: '12 years ago',
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    channelTitle: 'Luis Fonsi',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
    duration: '4:42',
    viewCount: '8.3B views',
    publishedAt: '7 years ago',
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    channelTitle: 'Ed Sheeran',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
    duration: '4:24',
    viewCount: '6.2B views',
    publishedAt: '7 years ago',
  },
  {
    id: 'RgKAFK5djSk',
    title: 'Wiz Khalifa - See You Again ft. Charlie Puth',
    channelTitle: 'Wiz Khalifa',
    thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg',
    duration: '3:58',
    viewCount: '6B views',
    publishedAt: '9 years ago',
  },
  {
    id: 'OPf0YbXqDm0',
    title: 'Mark Ronson - Uptown Funk ft. Bruno Mars (Official Video)',
    channelTitle: 'Mark Ronson',
    thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg',
    duration: '4:30',
    viewCount: '5B views',
    publishedAt: '10 years ago',
  },
  {
    id: 'fRh_vgS2dFE',
    title: 'Justin Bieber - Sorry (Official Music Video)',
    channelTitle: 'Justin Bieber',
    thumbnail: 'https://i.ytimg.com/vi/fRh_vgS2dFE/mqdefault.jpg',
    duration: '3:26',
    viewCount: '3.6B views',
    publishedAt: '9 years ago',
  },
]

export function VideoGrid({ onVideoSelect, onAddToQueue, settings }: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>(SAMPLE_VIDEOS)
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Recommended Videos</h2>
      <p className="text-gray-400 text-sm mb-6">
        Paste any YouTube URL in the search bar or click a video below to watch ad-free
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="video-card relative"
            onMouseEnter={() => setHoveredVideo(video.id)}
            onMouseLeave={() => setHoveredVideo(null)}
          >
            <div 
              className="video-thumbnail"
              onClick={() => onVideoSelect(video.id, video.title, video.channelTitle, video.thumbnail)}
            >
              <img src={video.thumbnail} alt={video.title} loading="lazy" />
              {video.duration && (
                <span className="video-duration">{video.duration}</span>
              )}
              
              {/* Hover overlay */}
              {hoveredVideo === video.id && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onVideoSelect(video.id, video.title, video.channelTitle, video.thumbnail)
                    }}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition"
                  >
                    <Play size={24} fill="white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToQueue(video)
                    }}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition"
                    title="Add to queue"
                  >
                    <ListPlus size={24} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-3 flex gap-3">
              <div className="w-9 h-9 rounded-full bg-youtube-gray flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 
                  className="font-medium line-clamp-2 text-sm cursor-pointer hover:text-blue-400"
                  onClick={() => onVideoSelect(video.id, video.title, video.channelTitle, video.thumbnail)}
                >
                  {video.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{video.channelTitle}</p>
                <p className="text-sm text-gray-400">
                  {video.viewCount} • {video.publishedAt}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Features info */}
      <div className="mt-12 p-6 bg-youtube-gray rounded-xl">
        <h3 className="text-lg font-semibold mb-4">NouTube Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-youtube-lightgray rounded-lg">
            <h4 className="font-medium text-youtube-red mb-2">🚫 Ad Blocking</h4>
            <p className="text-sm text-gray-400">Watch videos without any ads - pre-roll, mid-roll, or banner ads are all blocked.</p>
          </div>
          <div className="p-4 bg-youtube-lightgray rounded-lg">
            <h4 className="font-medium text-green-400 mb-2">⏭️ SponsorBlock</h4>
            <p className="text-sm text-gray-400">Automatically skip sponsored segments, intros, outros, and more.</p>
          </div>
          <div className="p-4 bg-youtube-lightgray rounded-lg">
            <h4 className="font-medium text-blue-400 mb-2">📱 No Shorts</h4>
            <p className="text-sm text-gray-400">Hide YouTube Shorts from your feed and search results.</p>
          </div>
          <div className="p-4 bg-youtube-lightgray rounded-lg">
            <h4 className="font-medium text-purple-400 mb-2">📋 Queue</h4>
            <p className="text-sm text-gray-400">Build a playlist queue to watch videos one after another.</p>
          </div>
          <div className="p-4 bg-youtube-lightgray rounded-lg">
            <h4 className="font-medium text-yellow-400 mb-2">💾 Progress Save</h4>
            <p className="text-sm text-gray-400">Resume watching from where you left off on long videos.</p>
          </div>
          <div className="p-4 bg-youtube-lightgray rounded-lg">
            <h4 className="font-medium text-cyan-400 mb-2">📜 History</h4>
            <p className="text-sm text-gray-400">Keep track of videos you've watched locally.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
