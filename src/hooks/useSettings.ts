import { useState, useCallback, useEffect } from 'react'
import { getItem, setItem } from '../utils/storage'

export interface Settings {
  hideShorts: boolean
  sponsorBlock: boolean
  autoplay: boolean
  saveProgress: boolean
  darkMode: boolean
  compactMode: boolean
}

const DEFAULT_SETTINGS: Settings = {
  hideShorts: true,
  sponsorBlock: true,
  autoplay: true,
  saveProgress: true,
  darkMode: true,
  compactMode: false,
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => 
    getItem('settings', DEFAULT_SETTINGS)
  )

  useEffect(() => {
    setItem('settings', settings)
  }, [settings])

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return {
    settings,
    updateSetting,
    resetSettings,
  }
}
