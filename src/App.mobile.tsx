import { useEffect, useState } from 'react'
import { LocalNotifications } from '@capacitor/local-notifications'
import { checkForUpdate, UpdateStatus, openDownloadUrl } from './lib/updateService'

function AppMobile() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Request notification permission on app start
    const requestPermissions = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        const result = await LocalNotifications.requestPermissions()
        console.log('Notification permission result:', result.display)
      } catch (error) {
        console.error('Error requesting notifications:', error)
      }
    }

    // Check for updates
    const checkUpdates = async () => {
      try {
        const status = await checkForUpdate()
        setUpdateStatus(status)
        
        if (status.hasUpdate) {
          setShowUpdateModal(true)
          
          // Show local notification about update
          if (status.latestVersion) {
            try {
              await LocalNotifications.schedule({
                notifications: [{
                  title: 'MyTube Update Available',
                  body: `Version ${status.latestVersion.version_name} is available. ${status.isForced ? 'Update required!' : `Update within ${status.daysUntilForced} day(s)`}`,
                  id: 1,
                  schedule: { at: new Date(Date.now() + 1000) }
                }]
              })
            } catch (e) {
              console.error('Notification error:', e)
            }
          }
        }
      } catch (error) {
        console.error('Update check error:', error)
      } finally {
        setIsChecking(false)
      }
    }

    requestPermissions()
    checkUpdates()
  }, [])

  const handleDownload = () => {
    if (updateStatus?.latestVersion?.download_url) {
      openDownloadUrl(updateStatus.latestVersion.download_url)
    }
  }

  const handleLater = () => {
    if (!updateStatus?.isBlocked) {
      setShowUpdateModal(false)
    }
  }

  // Show loading screen while checking
  if (isChecking) {
    return (
      <div className="h-screen w-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading MyTube...</p>
        </div>
      </div>
    )
  }

  // Show blocked screen if update is required
  if (updateStatus?.isBlocked && showUpdateModal) {
    return (
      <div className="h-screen w-screen bg-[#0f0f0f] flex items-center justify-center p-6">
        <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full text-center border border-yellow-400/30">
          <div className="w-20 h-20 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          
          <h2 className="text-yellow-400 text-2xl font-bold mb-2">Update Required</h2>
          
          <p className="text-gray-300 mb-4">
            A new version of MyTube is available. You must update to continue using the app.
          </p>
          
          {updateStatus.latestVersion && (
            <div className="bg-[#0f0f0f] rounded-lg p-3 mb-4 text-left">
              <p className="text-white font-semibold">
                Version {updateStatus.latestVersion.version_name}
              </p>
              {updateStatus.latestVersion.release_notes && (
                <p className="text-gray-400 text-sm mt-1">
                  {updateStatus.latestVersion.release_notes}
                </p>
              )}
            </div>
          )}
          
          <button
            onClick={handleDownload}
            className="w-full bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl hover:bg-yellow-300 transition-colors"
          >
            Download Update
          </button>
          
          <p className="text-gray-500 text-xs mt-4">
            Current version: {updateStatus.currentVersionCode}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#0f0f0f] relative">
      {/* Update Modal (dismissible) */}
      {showUpdateModal && updateStatus?.hasUpdate && !updateStatus.isBlocked && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full text-center border border-yellow-400/30">
            <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            
            <h2 className="text-yellow-400 text-xl font-bold mb-2">Update Available</h2>
            
            <p className="text-gray-300 mb-2">
              A new version of MyTube is available!
            </p>
            
            {updateStatus.daysUntilForced > 0 && (
              <p className="text-orange-400 text-sm mb-4">
                ⚠️ Update required in {updateStatus.daysUntilForced} day(s)
              </p>
            )}
            
            {updateStatus.latestVersion && (
              <div className="bg-[#0f0f0f] rounded-lg p-3 mb-4 text-left">
                <p className="text-white font-semibold">
                  Version {updateStatus.latestVersion.version_name}
                </p>
                {updateStatus.latestVersion.release_notes && (
                  <p className="text-gray-400 text-sm mt-1">
                    {updateStatus.latestVersion.release_notes}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleLater}
                className="flex-1 bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl hover:bg-yellow-300 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - YouTube */}
      <iframe
        src="https://m.youtube.com"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  )
}

export default AppMobile
