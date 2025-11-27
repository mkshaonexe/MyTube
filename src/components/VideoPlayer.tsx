import { useEffect, useRef, useState, useCallback } from 'react'
import { Settings } from '../hooks/useSettings'
import { getSkipSegments, shouldSkip, Segment, formatCategory, getCategoryColor } from '../utils/sponsorblock'
import { getVideoProgress, setVideoProgress } from '../utils/storage'
import { throttle } from 'es-toolkit'
import { SkipForward, Volume2, VolumeX, Maximize, Play, Pause, Settings as SettingsIcon } from 'lucide-react'

interface VideoPlayerProps {
  videoId: string
  settings: Settings
  onEnded?: () => void
}

declare global {
  interface Window {
    YT: {
      Player: new (element: string | HTMLElement, config: YTPlayerConfig) => YTPlayer
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayerConfig {
  videoId: string
  playerVars?: {
    autoplay?: number
    controls?: number
    modestbranding?: number
    rel?: number
    origin?: string
    enablejsapi?: number
    playsinline?: number
  }
  events?: {
    onReady?: (event: YTPlayerEvent) => void
    onStateChange?: (event: YTStateChangeEvent) => void
    onError?: (event: YTErrorEvent) => void
  }
}

interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  setVolume: (volume: number) => void
  getVolume: () => number
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  destroy: () => void
}

interface YTPlayerEvent {
  target: YTPlayer
}

interface YTStateChangeEvent {
  target: YTPlayer
  data: number
}

interface YTErrorEvent {
  target: YTPlayer
  data: number
}

export function VideoPlayer({ videoId, settings, onEnded }: VideoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [segments, setSegments] = useState<Segment[]>([])
  const [skippedSegment, setSkippedSegment] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }, [])

  // Initialize player
  useEffect(() => {
    let player: YTPlayer | null = null
    
    const initPlayer = () => {
      if (!containerRef.current) return
      
      player = new window.YT.Player('youtube-player', {
        videoId,
        playerVars: {
          autoplay: settings.autoplay ? 1 : 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
          enablejsapi: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target
            setDuration(event.target.getDuration())
            setIsReady(true)
            
            // Restore progress
            if (settings.saveProgress) {
              const savedProgress = getVideoProgress(videoId)
              if (savedProgress && savedProgress > 10) {
                event.target.seekTo(savedProgress, true)
              }
            }
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
            
            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded?.()
            }
          },
          onError: (event) => {
            console.error('YouTube Player Error:', event.data)
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      player?.destroy()
      playerRef.current = null
    }
  }, [videoId, settings.autoplay])

  // Fetch SponsorBlock segments
  useEffect(() => {
    if (settings.sponsorBlock) {
      getSkipSegments(videoId).then(result => {
        setSegments(result.segments)
      })
    } else {
      setSegments([])
    }
  }, [videoId, settings.sponsorBlock])

  // Save progress periodically
  const saveProgress = useCallback(
    throttle((time: number) => {
      if (settings.saveProgress && duration > 600) { // Only save for videos > 10 min
        setVideoProgress(videoId, time)
      }
    }, 5000),
    [videoId, settings.saveProgress, duration]
  )

  // Time update interval
  useEffect(() => {
    if (!isReady) return

    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const time = playerRef.current.getCurrentTime()
        setCurrentTime(time)
        saveProgress(time)
        
        // SponsorBlock skip
        if (settings.sponsorBlock && segments.length > 0) {
          const skipTo = shouldSkip(time, segments)
          if (skipTo !== null) {
            playerRef.current.seekTo(skipTo, true)
            const segment = segments.find(s => time >= s.segment[0] && time < s.segment[1])
            if (segment) {
              setSkippedSegment(formatCategory(segment.category))
              setTimeout(() => setSkippedSegment(null), 3000)
            }
          }
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isReady, isPlaying, segments, settings.sponsorBlock, saveProgress])

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pauseVideo()
    } else {
      playerRef.current?.playVideo()
    }
  }

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute()
      } else {
        playerRef.current.mute()
      }
      setIsMuted(!isMuted)
    }
  }

  const seekTo = (seconds: number) => {
    playerRef.current?.seekTo(seconds, true)
    setCurrentTime(seconds)
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div ref={containerRef} className="noutube-player-container relative group">
        <div id="youtube-player" className="absolute inset-0" />
        
        {/* SponsorBlock skip notification */}
        {skippedSegment && (
          <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 z-10">
            <SkipForward size={20} className="text-green-400" />
            <span>Skipped: {skippedSegment}</span>
          </div>
        )}
        
        {/* Custom controls overlay (optional) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {/* Progress bar with sponsor segments */}
          <div className="relative h-1 bg-white/30 rounded mb-2 cursor-pointer pointer-events-auto" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const percent = (e.clientX - rect.left) / rect.width
            seekTo(percent * duration)
          }}>
            <div 
              className="absolute h-full bg-youtube-red rounded"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* SponsorBlock segment markers */}
            {segments.map((segment, i) => (
              <div
                key={i}
                className="absolute h-full"
                style={{
                  left: `${(segment.segment[0] / duration) * 100}%`,
                  width: `${((segment.segment[1] - segment.segment[0]) / duration) * 100}%`,
                  backgroundColor: getCategoryColor(segment.category),
                  opacity: 0.7,
                }}
                title={formatCategory(segment.category)}
              />
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="pointer-events-auto">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={toggleMute} className="pointer-events-auto">
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleFullscreen} className="pointer-events-auto">
                <Maximize size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Video info */}
      <div className="mt-4">
        <h1 className="text-xl font-bold">Now Playing</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
          <span>Video ID: {videoId}</span>
          {settings.sponsorBlock && segments.length > 0 && (
            <span className="text-green-400">SponsorBlock: {segments.length} segments</span>
          )}
        </div>
      </div>
      
      {/* Settings info */}
      <div className="mt-6 p-4 bg-youtube-gray rounded-lg">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <SettingsIcon size={20} />
          Active Features
        </h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-youtube-lightgray rounded-full text-sm">Ad Blocking</span>
          {settings.sponsorBlock && (
            <span className="px-3 py-1 bg-green-600/30 text-green-400 rounded-full text-sm">SponsorBlock</span>
          )}
          {settings.hideShorts && (
            <span className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded-full text-sm">Hide Shorts</span>
          )}
          {settings.saveProgress && (
            <span className="px-3 py-1 bg-purple-600/30 text-purple-400 rounded-full text-sm">Save Progress</span>
          )}
        </div>
      </div>
    </div>
  )
}
