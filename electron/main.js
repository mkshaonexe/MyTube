const { app, BrowserWindow, session } = require('electron')
const { join } = require('path')
const { readFileSync } = require('fs')

// Read the content script
const contentScript = readFileSync(join(__dirname, '../server/content-script.js'), 'utf-8')

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
    title: 'NouTube - Ad-Free YouTube',
    backgroundColor: '#0f0f0f',
  })

  // Load the Vite dev server (always use port 5173 in dev)
  const VITE_DEV_URL = 'http://localhost:5173'
  
  win.loadURL(VITE_DEV_URL).catch(() => {
    console.error('Failed to load Vite dev server. Make sure it is running.')
  })

  // Open DevTools in development
  // win.webContents.openDevTools()

  // Remove security headers that block webview
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders }
    
    delete responseHeaders['x-frame-options']
    delete responseHeaders['X-Frame-Options']
    delete responseHeaders['content-security-policy']
    delete responseHeaders['Content-Security-Policy']
    
    callback({ responseHeaders })
  })
}

app.whenReady().then(() => {
  // Enable webview and inject content script
  app.on('web-contents-created', (_, contents) => {
    contents.on('will-attach-webview', (event, webPreferences, params) => {
      // Ensure webview has correct settings
      webPreferences.nodeIntegration = false
      webPreferences.contextIsolation = true
      webPreferences.webSecurity = false // Allow loading YouTube
    })

    // Inject ad-blocking script into webview when YouTube loads
    contents.on('did-attach-webview', (event, webContents) => {
      webContents.on('dom-ready', () => {
        const url = webContents.getURL()
        if (url.includes('youtube.com')) {
          webContents.executeJavaScript(contentScript).catch(err => {
            console.error('Failed to inject content script:', err)
          })
          console.log('🦦 NouTube: Ad-blocking script injected into YouTube')
        }
      })
    })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
