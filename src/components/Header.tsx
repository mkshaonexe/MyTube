import { useState, FormEvent } from 'react'
import { Menu, Search, ListVideo, Youtube } from 'lucide-react'

interface HeaderProps {
  onSearch: (query: string) => void
  onMenuClick: () => void
  onQueueClick: () => void
  queueCount: number
}

export function Header({ onSearch, onMenuClick, onQueueClick, queueCount }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      onSearch(searchValue.trim())
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-youtube-dark flex items-center justify-between px-4 z-50 border-b border-youtube-gray">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-youtube-gray"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-1 cursor-pointer">
          <Youtube size={32} className="text-youtube-red" />
          <span className="text-xl font-semibold hidden sm:inline">NouTube</span>
        </div>
      </div>

      {/* Center section - Search */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-2xl mx-4">
        <div className="flex">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search or paste YouTube URL"
            className="search-input"
          />
          <button type="submit" className="search-button">
            <Search size={20} />
          </button>
        </div>
      </form>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onQueueClick}
          className="p-2 rounded-full hover:bg-youtube-gray relative"
        >
          <ListVideo size={24} />
          {queueCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-youtube-red text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {queueCount > 9 ? '9+' : queueCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
