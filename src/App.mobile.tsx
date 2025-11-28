import { useEffect } from 'react'
import { LocalNotifications } from '@capacitor/local-notifications'

function AppMobile() {
  useEffect(() => {
    // Request notification permission on app start
    const requestPermissions = async () => {
      try {
        // Wait a moment for Capacitor to initialize
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Directly request permissions
        const result = await LocalNotifications.requestPermissions()
        console.log('Notification permission result:', result.display)
        
        // If for some reason the above didn't work, check and try again
        const status = await LocalNotifications.checkPermissions()
        if (status.display !== 'granted') {
          await LocalNotifications.requestPermissions()
        }
      } catch (error) {
        console.error('Error requesting notifications:', error)
      }
    }

    requestPermissions()
  }, [])

  return (
    <div className="h-screen w-screen bg-[#0f0f0f]">
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
