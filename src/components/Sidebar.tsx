import { Home, History, Settings, ListVideo, TrendingUp, Music, Gamepad2, Film } from 'lucide-react'
import type { View } from '../App'

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
}

const menuItems = [
  { icon: Home, label: 'Home', view: 'home' as View },
  { icon: History, label: 'History', view: 'history' as View },
  { icon: ListVideo, label: 'Queue', view: 'queue' as View },
  { icon: Settings, label: 'Settings', view: 'settings' as View },
]

const exploreItems = [
  { icon: TrendingUp, label: 'Trending' },
  { icon: Music, label: 'Music' },
  { icon: Gamepad2, label: 'Gaming' },
  { icon: Film, label: 'Movies' },
]

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav>
        {menuItems.map((item) => (
          <div
            key={item.view}
            className={`sidebar-item ${currentView === item.view ? 'active' : ''}`}
            onClick={() => onNavigate(item.view)}
          >
            <item.icon size={24} />
            <span>{item.label}</span>
          </div>
        ))}
        
        <hr className="border-youtube-gray my-3" />
        
        <h3 className="px-3 py-2 text-sm text-gray-400 font-medium">Explore</h3>
        {exploreItems.map((item) => (
          <div key={item.label} className="sidebar-item">
            <item.icon size={24} />
            <span>{item.label}</span>
          </div>
        ))}
        
        <hr className="border-youtube-gray my-3" />
        
        <div className="px-3 py-2 text-xs text-gray-500">
          <p className="mb-2">NouTube - Ad-Free YouTube Experience</p>
          <p>Features:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Ad blocking</li>
            <li>SponsorBlock</li>
            <li>Hide Shorts</li>
            <li>Video queue</li>
            <li>Watch history</li>
          </ul>
        </div>
      </nav>
    </aside>
  )
}
