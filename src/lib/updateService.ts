import { supabase, APP_VERSION_CODE } from './supabase'

export interface AppVersion {
  id: string
  version_code: number
  version_name: string
  download_url: string
  release_notes: string | null
  is_mandatory: boolean
  min_supported_version: number
  created_at: string
}

export interface UpdateStatus {
  hasUpdate: boolean
  isForced: boolean
  isBlocked: boolean
  latestVersion: AppVersion | null
  daysUntilForced: number
  currentVersionCode: number
}

const STORAGE_KEY = 'mytube_update_check'
const FORCE_UPDATE_DAYS = 1 // Days before forcing update

// Get stored update check data
function getStoredData(): { firstSeen: string | null } {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : { firstSeen: null }
  } catch {
    return { firstSeen: null }
  }
}

// Save update check data
function saveStoredData(data: { firstSeen: string | null }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save update data:', e)
  }
}

// Clear stored data (call after successful update)
export function clearUpdateData() {
  localStorage.removeItem(STORAGE_KEY)
}

// Check for updates
export async function checkForUpdate(): Promise<UpdateStatus> {
  const defaultStatus: UpdateStatus = {
    hasUpdate: false,
    isForced: false,
    isBlocked: false,
    latestVersion: null,
    daysUntilForced: FORCE_UPDATE_DAYS,
    currentVersionCode: APP_VERSION_CODE
  }

  try {
    // Fetch latest version from Supabase
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .order('version_code', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.error('Failed to fetch version:', error)
      return defaultStatus
    }

    const latestVersion = data as AppVersion

    // Check if current version is below minimum supported
    if (APP_VERSION_CODE < latestVersion.min_supported_version) {
      return {
        hasUpdate: true,
        isForced: true,
        isBlocked: true, // Block immediately if below minimum
        latestVersion,
        daysUntilForced: 0,
        currentVersionCode: APP_VERSION_CODE
      }
    }

    // Check if there's a newer version
    if (latestVersion.version_code > APP_VERSION_CODE) {
      const storedData = getStoredData()
      
      // First time seeing this update
      if (!storedData.firstSeen) {
        saveStoredData({ firstSeen: new Date().toISOString() })
        
        return {
          hasUpdate: true,
          isForced: latestVersion.is_mandatory,
          isBlocked: latestVersion.is_mandatory, // Block immediately if mandatory
          latestVersion,
          daysUntilForced: latestVersion.is_mandatory ? 0 : FORCE_UPDATE_DAYS,
          currentVersionCode: APP_VERSION_CODE
        }
      }

      // Calculate days since first seen
      const firstSeenDate = new Date(storedData.firstSeen)
      const now = new Date()
      const daysSinceFirstSeen = Math.floor((now.getTime() - firstSeenDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, FORCE_UPDATE_DAYS - daysSinceFirstSeen)

      // Force update if mandatory OR if grace period expired
      const shouldForce = latestVersion.is_mandatory || daysSinceFirstSeen >= FORCE_UPDATE_DAYS

      return {
        hasUpdate: true,
        isForced: shouldForce,
        isBlocked: shouldForce,
        latestVersion,
        daysUntilForced: daysRemaining,
        currentVersionCode: APP_VERSION_CODE
      }
    }

    // No update available, clear any stored data
    clearUpdateData()
    
    return defaultStatus
  } catch (e) {
    console.error('Update check error:', e)
    return defaultStatus
  }
}

// Open download URL
export function openDownloadUrl(url: string) {
  // Open in external browser
  window.open(url, '_system')
}
