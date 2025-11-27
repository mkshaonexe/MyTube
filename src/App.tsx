import { useEffect, useState } from 'react'

function App() {
  const [url, setUrl] = useState('https://www.youtube.com')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    console.log('🦦 NouTube Electron App Starting...')
  }, [])

  const handleRefresh = () => {
    const webview = document.querySelector('webview') as any
    webview?.reload()
    setMenuOpen(false)
  }

  const handleHome = () => {
    setUrl('https://www.youtube.com')
    setMenuOpen(false)
  }

  return (
    <div className="h-screen bg-[#0f0f0f] relative">
      {/* Floating 3-dot menu button */}
      <div className="absolute top-2 right-2 z-50">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5"/>
            <circle cx="8" cy="8" r="1.5"/>
            <circle cx="8" cy="13" r="1.5"/>
          </svg>
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute top-10 right-0 bg-[#282828] rounded-lg shadow-lg overflow-hidden min-w-[140px]">
            <button
              onClick={handleHome}
              className="w-full px-4 py-2.5 text-left text-white hover:bg-[#3a3a3a] flex items-center gap-3 text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1l7 6v8H9V9H7v6H1V7l7-6z"/>
              </svg>
              Home
            </button>
            <button
              onClick={handleRefresh}
              className="w-full px-4 py-2.5 text-left text-white hover:bg-[#3a3a3a] flex items-center gap-3 text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3V1L4 5l4 4V7c2.2 0 4 1.8 4 4 0 .7-.2 1.4-.5 2l1.5 1.5c.7-1 1-2.2 1-3.5 0-3.3-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4 0-.7.2-1.4.5-2L3 5.5C2.3 6.5 2 7.7 2 9c0 3.3 2.7 6 6 6v2l4-4-4-4v2z"/>
              </svg>
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* YouTube Webview - Full screen */}
      <webview
        src={url}
        className="w-full h-full"
        allowpopups="true"
        partition="persist:youtube"
      />
    </div>
  )
}

export default App
