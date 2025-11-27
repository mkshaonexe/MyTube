import type { Settings as SettingsType } from '../hooks/useSettings'
import { Shield, SkipForward, EyeOff, Play, Save, Moon, Minimize2 } from 'lucide-react'

interface SettingsProps {
  settings: SettingsType
  onUpdateSetting: <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => void
}

interface SettingItem {
  key: keyof SettingsType
  label: string
  description: string
  icon: typeof Shield
  color: string
}

const settingItems: SettingItem[] = [
  {
    key: 'hideShorts',
    label: 'Hide Shorts',
    description: 'Remove YouTube Shorts from search results and recommendations',
    icon: EyeOff,
    color: 'text-blue-400',
  },
  {
    key: 'sponsorBlock',
    label: 'SponsorBlock',
    description: 'Automatically skip sponsored segments, intros, outros, and self-promotions',
    icon: SkipForward,
    color: 'text-green-400',
  },
  {
    key: 'autoplay',
    label: 'Autoplay',
    description: 'Automatically start playing videos when you open them',
    icon: Play,
    color: 'text-red-400',
  },
  {
    key: 'saveProgress',
    label: 'Save Progress',
    description: 'Remember your position in videos longer than 10 minutes',
    icon: Save,
    color: 'text-purple-400',
  },
  {
    key: 'darkMode',
    label: 'Dark Mode',
    description: 'Use dark theme (always on by default)',
    icon: Moon,
    color: 'text-yellow-400',
  },
  {
    key: 'compactMode',
    label: 'Compact Mode',
    description: 'Use a more compact layout for video lists',
    icon: Minimize2,
    color: 'text-cyan-400',
  },
]

export function Settings({ settings, onUpdateSetting }: SettingsProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {/* Ad blocking notice */}
      <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Shield className="text-green-400" size={24} />
          <div>
            <h3 className="font-semibold text-green-400">Ad Blocking Active</h3>
            <p className="text-sm text-gray-400">YouTube ads are automatically blocked. This cannot be disabled.</p>
          </div>
        </div>
      </div>
      
      <div className="settings-panel">
        {settingItems.map((item) => (
          <div key={item.key} className="settings-item">
            <div className="flex items-center gap-4">
              <item.icon className={item.color} size={24} />
              <div>
                <h3 className="font-medium">{item.label}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            </div>
            <button
              className={`toggle-switch ${settings[item.key] ? 'active' : ''}`}
              onClick={() => onUpdateSetting(item.key, !settings[item.key])}
              aria-label={`Toggle ${item.label}`}
            />
          </div>
        ))}
      </div>
      
      {/* Keyboard shortcuts */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
        <div className="settings-panel">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Toggle Queue</span>
              <kbd className="px-2 py-1 bg-youtube-lightgray rounded text-sm">Q</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Close / Go Back</span>
              <kbd className="px-2 py-1 bg-youtube-lightgray rounded text-sm">Esc</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Play / Pause</span>
              <kbd className="px-2 py-1 bg-youtube-lightgray rounded text-sm">Space</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Fullscreen</span>
              <kbd className="px-2 py-1 bg-youtube-lightgray rounded text-sm">F</kbd>
            </div>
          </div>
        </div>
      </div>
      
      {/* About section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">About NouTube</h2>
        <div className="settings-panel text-gray-400">
          <p className="mb-4">
            NouTube is an ad-free YouTube experience that blocks all types of advertisements
            and provides additional features like SponsorBlock integration.
          </p>
          <p className="mb-4">
            This is a web application version of the NouTube project, designed to work
            in your browser with minimal setup.
          </p>
          <p className="text-sm">
            Version 1.0.0 • Built with React + Vite + TailwindCSS
          </p>
        </div>
      </div>
    </div>
  )
}
