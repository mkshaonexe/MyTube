import type { Video } from '../App'
import { X, Trash2, Play, GripVertical } from 'lucide-react'

interface QueueProps {
  queue: Video[]
  currentVideoId: string | null
  onVideoSelect: (video: Video) => void
  onRemove: (videoId: string) => void
  onClear: () => void
  onClose: () => void
}

export function Queue({ queue, currentVideoId, onVideoSelect, onRemove, onClear, onClose }: QueueProps) {
  return (
    <div className="queue-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Queue ({queue.length})</h2>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={onClear}
              className="p-2 hover:bg-youtube-gray rounded-full text-gray-400 hover:text-white"
              title="Clear queue"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-youtube-gray rounded-full"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {queue.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-2">Your queue is empty</p>
          <p className="text-sm">Add videos to your queue to watch them in order</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((video, index) => (
            <div
              key={video.id}
              className={`queue-item ${currentVideoId === video.id ? 'active' : ''}`}
            >
              <div className="text-gray-500 cursor-grab">
                <GripVertical size={16} />
              </div>
              <span className="text-gray-500 text-sm w-6">{index + 1}</span>
              <div 
                className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden cursor-pointer group"
                onClick={() => onVideoSelect(video)}
              >
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Play size={20} fill="white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 
                  className="text-sm font-medium line-clamp-2 cursor-pointer hover:text-blue-400"
                  onClick={() => onVideoSelect(video)}
                >
                  {video.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">{video.channelTitle}</p>
              </div>
              <button
                onClick={() => onRemove(video.id)}
                className="p-1 hover:bg-youtube-lightgray rounded text-gray-400 hover:text-white"
                title="Remove from queue"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {queue.length > 0 && (
        <div className="mt-4 pt-4 border-t border-youtube-gray">
          <p className="text-sm text-gray-400">
            Tip: Videos will play automatically when the current one ends
          </p>
        </div>
      )}
    </div>
  )
}
