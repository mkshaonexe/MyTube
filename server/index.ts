import express, { Request, Response } from 'express'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Readable } from 'stream'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

// Read the content script
const contentScript = readFileSync(join(__dirname, 'content-script.js'), 'utf-8')

// Ad-blocking CSS
const adBlockCSS = `
  ytd-page-top-ad-layout-renderer,
  ytd-in-feed-ad-layout-renderer,
  ad-slot-renderer,
  yt-mealbar-promo-renderer,
  ytm-promoted-sparkles-web-renderer,
  .ytd-player-legacy-desktop-watch-ads-renderer,
  .video-ads,
  #player-ads,
  ytd-ad-slot-renderer,
  ytd-banner-promo-renderer,
  ytd-statement-banner-renderer,
  .ytd-rich-item-renderer[is-ad],
  ytd-display-ad-renderer,
  .ytp-ad-module,
  .ytp-ad-overlay-container,
  .ytp-ad-text-overlay,
  #masthead-ad {
    display: none !important;
  }
`

// Helper to stream response
async function streamResponse(response: globalThis.Response, res: Response) {
  if (!response.body) {
    res.end()
    return
  }
  
  const reader = response.body.getReader()
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }
    res.end()
  } catch (e) {
    res.end()
  }
}

// Proxy all requests to YouTube
app.use('*', async (req: Request, res: Response) => {
  const path = req.originalUrl
  const targetUrl = `https://www.youtube.com${path}`
  
  try {
    // Build headers
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': req.headers.accept as string || '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    }
    
    // Forward important headers
    if (req.headers.cookie) headers['Cookie'] = req.headers.cookie as string
    if (req.headers.range) headers['Range'] = req.headers.range as string
    if (req.headers.referer) headers['Referer'] = 'https://www.youtube.com/'
    
    // For non-HTML requests, allow compression
    const isHtmlRequest = req.headers.accept?.includes('text/html')
    if (!isHtmlRequest) {
      headers['Accept-Encoding'] = req.headers['accept-encoding'] as string || 'gzip, deflate, br'
    } else {
      headers['Accept-Encoding'] = 'identity'
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      redirect: 'follow',
    })

    const contentType = response.headers.get('content-type') || ''
    
    // Copy ALL response headers for streaming
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      // Skip problematic headers for HTML only
      if (contentType.includes('text/html')) {
        if (['x-frame-options', 'content-security-policy', 'content-length'].includes(lowerKey)) {
          return
        }
      }
      // Always skip these
      if (['transfer-encoding'].includes(lowerKey)) {
        return
      }
      res.setHeader(key, value)
    })
    
    // Set status code
    res.status(response.status)

    // Handle HTML responses - inject our scripts
    if (contentType.includes('text/html')) {
      res.removeHeader('x-frame-options')
      res.removeHeader('content-security-policy')
      
      let html = await response.text()
      
      // Inject our ad-blocking script and CSS
      const injection = `
        <script>${contentScript}</script>
        <style>${adBlockCSS}</style>
      `
      
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${injection}</head>`)
      } else if (html.includes('<body')) {
        html = html.replace('<body', `${injection}<body`)
      }
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.send(html)
      return
    }
    
    // Handle player API - remove ads from JSON
    if (contentType.includes('application/json') && path.includes('/youtubei/v1/player')) {
      try {
        const data = await response.json()
        delete data.adBreakHeartbeatParams
        delete data.adPlacements
        delete data.adSlots
        delete data.playerAds
        res.json(data)
        return
      } catch {
        // Fall through to streaming
      }
    }
    
    // For everything else (videos, images, JS, CSS), STREAM the response
    // This is crucial for video playback performance
    await streamResponse(response, res)
    
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).send(`
      <html>
        <body style="background:#0f0f0f;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h1>🦦 NouTube</h1>
            <p>Error loading. Please refresh.</p>
          </div>
        </body>
      </html>
    `)
  }
})

app.listen(PORT, () => {
  console.log(``)
  console.log(`  🦦 NouTube Proxy Server`)
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  ➜ Local: http://localhost:${PORT}`)
  console.log(`  ➜ Open this URL to watch YouTube ad-free!`)
  console.log(``)
})
