// NouTube Ad-Blocking Script for MyTube
(function () {
  'use strict';

  // Keys to remove from player response (ads)
  const AD_KEYS = ['adBreakHeartbeatParams', 'adPlacements', 'adSlots', 'playerAds'];

  // Transform player response to remove ads
  function transformPlayerResponse(text) {
    try {
      const data = JSON.parse(text);
      AD_KEYS.forEach(key => delete data[key]);
      return JSON.stringify(data);
    } catch (e) {
      return text;
    }
  }

  // Transform search response to remove shorts
  function transformSearchResponse(text) {
    try {
      const data = JSON.parse(text);
      const sectionListRenderer =
        data.contents?.sectionListRenderer ||
        data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer;
      const itemSectionRenderer =
        sectionListRenderer?.contents?.[0]?.itemSectionRenderer ||
        data.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.itemSectionRenderer;

      if (itemSectionRenderer) {
        itemSectionRenderer.contents = itemSectionRenderer.contents.filter(item => {
          if (item.gridShelfViewModel) return false;
          if (item.videoWithContextRenderer?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url?.startsWith('/shorts')) return false;
          return true;
        });
      }
      return JSON.stringify(data);
    } catch (e) {
      return text;
    }
  }

  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const request = args[0];
    const url = request instanceof Request ? request.url : request.toString();
    let res = await originalFetch.apply(this, args);

    try {
      const pathname = new URL(url).pathname;
      if (pathname.includes('/youtubei/v1/player')) {
        const text = await res.text();
        return new Response(transformPlayerResponse(text), {
          status: res.status,
          headers: res.headers
        });
      }
      if (pathname.includes('/youtubei/v1/search')) {
        const text = await res.text();
        return new Response(transformSearchResponse(text), {
          status: res.status,
          headers: res.headers
        });
      }
    } catch (e) {
      console.error('MyTube fetch intercept error:', e);
    }
    return res;
  };

  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    const urlStr = url.toString();
    this.addEventListener('readystatechange', function () {
      if (urlStr.includes('youtubei/v1/player') && this.readyState === 4) {
        try {
          const text = transformPlayerResponse(this.responseText);
          Object.defineProperty(this, 'response', { writable: true });
          Object.defineProperty(this, 'responseText', { writable: true });
          this.response = this.responseText = text;
        } catch (e) { }
      }
    });
    return originalXHROpen.apply(this, arguments);
  };

  // Inject CSS to hide ads and shorts
  function injectCSS() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = `
      /* Hide all ad elements */
      ytd-page-top-ad-layout-renderer,
      ytd-in-feed-ad-layout-renderer,
      ad-slot-renderer,
      yt-mealbar-promo-renderer,
      ytm-promoted-sparkles-web-renderer,
      ytm-promoted-video-renderer,
      .ytd-player-legacy-desktop-watch-ads-renderer,
      .video-ads,
      .ytp-ad-module,
      .ytp-ad-overlay-container,
      .ytp-ad-text-overlay,
      .ytp-ad-skip-button-container,
      #player-ads,
      #masthead-ad,
      ytd-display-ad-renderer,
      ytd-companion-slot-renderer,
      ytd-action-companion-ad-renderer,
      ytd-promoted-sparkles-text-search-renderer,
      a.ytp-ad-preview-container,
      div#player-overlay\\:0,
      .ytm-promoted-sparkles-web-renderer,
      ytm-companion-ad-renderer,
      .ad-showing .ytp-ad-player-overlay,
      .ytm-rich-item-renderer[is-ad],
      ytm-primetime-promo-renderer,
      ytm-statement-banner-renderer,
      .ytm-promoted-sparkles-web-renderer,
      a.app-install-link,
      .ytGridShelfViewModelHost,
      /* Hide quick action buttons */
      .quick-actions-wrapper.enable-rtl-mirroring,
      /* Hide "Open App" button */
      .mobile-topbar-header-content a[href*="youtube.app.link"],
      a[href*="youtube.app.link"],
      a[href*="redirect_to_app"],
      .ytm-open-app-pill-button-renderer,
      .ytm-autonav-toggle-button-renderer,
      /* Hide YouTube logo text SVG */
      g#youtube-paths_yt10,
      g[id*="youtube-paths"],
      #logo-icon g[id*="youtube"] {
        display: none !important;
      }
      
      /* Make video player use full space when ads are hidden */
      .ad-showing video {
        visibility: visible !important;
      }
      .ad-showing .html5-video-container {
        display: block !important;
      }
      
      /* Watch Mode - Hide everything below the player */
      body.mytube-watch-mode ytm-item-section-renderer,
      body.mytube-watch-mode ytm-comment-section-renderer,
      body.mytube-watch-mode ytm-media-item-metadata-renderer,
      body.mytube-watch-mode ytm-video-description-header-renderer,
      body.mytube-watch-mode .ytm-promoted-sparkles-web-renderer,
      body.mytube-watch-mode ytm-rich-section-renderer,
      body.mytube-watch-mode .watch-below-the-player,
      body.mytube-watch-mode ytm-pivot-bar-renderer,
      body.mytube-watch-mode ytm-slim-video-metadata-section-renderer,
      body.mytube-watch-mode ytm-engagement-panel-section-list-renderer,
      body.mytube-watch-mode ytm-content-metadata-section-renderer,
      body.mytube-watch-mode .ytm-ads-details-announcement-renderer {
        display: none !important;
      }
      
      /* Ensure player stays at top and fills width */
      body.mytube-watch-mode #player-container-id {
        position: relative !important;
        z-index: 10 !important;
        background: black !important;
      }
      
      /* Hide the gap below the player */
      body.mytube-watch-mode #results {
        display: none !important;
      }

      /* Home Mode - Minimalist feed */
      body.mytube-home-mode ytm-rich-grid-renderer,
      body.mytube-home-mode .ytm-feed-filter-bar-renderer,
      body.mytube-home-mode ytm-media-item-metadata-renderer,
      body.mytube-home-mode .ytm-promoted-sparkles-web-renderer {
        display: none !important;
      }
      
      body.mytube-home-mode {
        background: white !important;
      }

      body.mytube-home-mode ytm-mobile-topbar-renderer {
        background: white !important;
        border-bottom: none !important;
      }

      /* Custom Minimalist Home UI */
      #mytube-minimalist-home {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 20vh;
        box-sizing: border-box;
      }

      .mytube-home-logo {
        width: 120px;
        height: 80px;
        margin-bottom: 24px;
        color: #FF0000;
      }

      .mytube-search-container {
        width: 90%;
        max-width: 500px;
        display: flex;
        align-items: center;
        background: #f1f1f1;
        border-radius: 40px;
        padding: 10px 20px;
        margin-bottom: 40px;
        cursor: text;
      }

      .mytube-search-icon {
        width: 24px;
        height: 24px;
        margin-right: 12px;
        opacity: 0.6;
      }

      .mytube-search-placeholder {
        flex: 1;
        color: #606060;
        font-size: 16px;
        font-family: Roboto, Arial, sans-serif;
      }

      .mytube-home-card {
        width: 90%;
        max-width: 400px;
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        text-align: center;
        border: 1px solid #e5e5e5;
      }

      .mytube-card-title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 12px;
        color: #0f0f0f;
        font-family: Roboto, Arial, sans-serif;
      }

      .mytube-card-text {
        font-size: 14px;
        color: #606060;
        line-height: 1.5;
        font-family: Roboto, Arial, sans-serif;
      }
    `;

    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.head.appendChild(style);
      });
    }
  }

  // Auto-skip ads if they somehow appear
  function setupAdSkipper() {
    const observer = new MutationObserver(() => {
      // Skip button
      const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
      if (skipBtn) {
        skipBtn.click();
      }

      // Skip overlay ads
      const closeBtn = document.querySelector('.ytp-ad-overlay-close-button');
      if (closeBtn) {
        closeBtn.click();
      }

      // If video is ad, try to skip
      const adVideo = document.querySelector('.ad-showing video');
      if (adVideo) {
        adVideo.currentTime = adVideo.duration || 9999;
      }

      // Dismiss promo dialogs
      const dismissBtn = document.querySelector('ytmusic-mealbar-promo-renderer .dismiss-button, .yt-mealbar-promo-renderer__dismiss-button');
      if (dismissBtn) {
        dismissBtn.click();
      }

      // Modify YouTube header to MyTube - try multiple selectors
      const selectors = [
        'ytm-mobile-topbar-renderer .mobile-topbar-header-content ytm-logo a yt-formatted-string',
        'ytm-mobile-topbar-renderer ytm-logo yt-formatted-string',
        '.mobile-topbar-header-content .yt-core-attributed-string',
        'ytm-logo-renderer yt-formatted-string',
        'ytm-logo a span',
        '.topbar-header-content span.yt-core-attributed-string',
        'header a[href="/"] span'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && el.textContent && el.textContent.trim() === 'YouTube') {
            el.textContent = 'MyTube';
          }
        });
      }

      // Also try to find any element with YouTube text in the header
      const headerArea = document.querySelector('ytm-mobile-topbar-renderer, .mobile-topbar-header');
      if (headerArea) {
        const allSpans = headerArea.querySelectorAll('span, yt-formatted-string');
        allSpans.forEach(span => {
          if (span.textContent && span.textContent.trim() === 'YouTube') {
            span.textContent = 'MyTube';
          }
        });
      }

      // Hide "Open App" button - specific selectors only
      const openAppSelectors = [
        'a[href*="youtube.app.link"]',
        'a[href*="redirect_to_app"]',
        '.ytm-open-app-pill-button-renderer'
      ];

      for (const selector of openAppSelectors) {
        const btns = document.querySelectorAll(selector);
        btns.forEach(btn => {
          if (btn) btn.style.display = 'none';
        });
      }

      // Find links/buttons with EXACTLY "Open App" text and hide them
      const allLinks = document.querySelectorAll('a, button');
      allLinks.forEach(link => {
        const text = link.textContent ? link.textContent.trim() : '';
        if (text === 'Open App' || text === 'Open app' || text === 'OPEN APP') {
          link.style.display = 'none';
        }
      });

      // Hide YouTube logo text SVG elements and inject "MyTube" text
      const youtubeLogoSVGs = document.querySelectorAll('g#youtube-paths_yt10, g[id*="youtube-paths"], #logo-icon g[id*="youtube"]');
      youtubeLogoSVGs.forEach(svg => {
        if (svg) svg.style.display = 'none';
      });

      // Inject "MyTube" text in the header
      const logoContainer = document.querySelector('ytm-logo, ytm-logo-renderer, #logo-icon, .mobile-topbar-header-content ytm-logo');
      if (logoContainer && !logoContainer.querySelector('.mytube-custom-text')) {
        // Create MyTube text element
        const myTubeText = document.createElement('span');
        myTubeText.className = 'mytube-custom-text';
        myTubeText.textContent = 'MyTube';
        myTubeText.style.cssText = `
          color: white;
          font-size: 18px;
          font-weight: 500;
          font-family: "YouTube Sans", "Roboto", sans-serif;
          margin-left: 8px;
          display: inline-block;
          vertical-align: middle;
        `;

        // Insert the text next to the logo icon
        const logoLink = logoContainer.querySelector('a');
        if (logoLink) {
          logoLink.appendChild(myTubeText);
        } else {
          logoContainer.appendChild(myTubeText);
        }
      }

      // Fallback: inject directly into mobile topbar
      if (!document.querySelector('.mytube-custom-text')) {
        const topbar = document.querySelector('ytm-mobile-topbar-renderer, .mobile-topbar-header');
        if (topbar) {
          const myTubeText = document.createElement('div');
          myTubeText.className = 'mytube-custom-text';
          myTubeText.textContent = 'MyTube';
          myTubeText.style.cssText = `
            position: absolute !important;
            left: 50px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            color: #fff !important;
            font-size: 20px !important;
            font-weight: 500 !important;
            font-family: "YouTube Sans", "Roboto", Arial, sans-serif !important;
            z-index: 9999 !important;
          `;
          topbar.appendChild(myTubeText);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // Inject custom minimalist home UI
    function injectMinimalistHome() {
      if (document.getElementById('mytube-minimalist-home')) return;

      const container = document.createElement('div');
      container.id = 'mytube-minimalist-home';
      container.innerHTML = `
        <div class="mytube-home-logo">
          <svg viewBox="0 0 200 60" preserveAspectRatio="xMidYMid meet">
            <g viewBox="0 0 200 60" preserveAspectRatio="xMidYMid meet" class="style-scope ytd-logo">
              <g class="style-scope ytd-logo">
                <path fill="#FF0000" d="M63,14.87c-0.72-2.7-2.85-4.83-5.56-5.56C52.54,8,32.88,8,32.88,8S13.23,8,8.32,9.31c-2.7,0.72-4.83,2.85-5.56,5.56 C1.45,19.77,1.45,30,1.45,30s0,10.23,1.31,15.13c0.72,2.7,2.85,4.83,5.56,5.56C13.23,52,32.88,52,32.88,52s19.67,0,24.56-1.31 c2.7-0.72,4.83-2.85,5.56-5.56C64.31,40.23,64.31,30,64.31,30S64.31,19.77,63,14.87z" class="style-scope ytd-logo"></path>
                <polygon fill="#FFFFFF" points="26.6,39.43 42.93,30 26.6,20.57" class="style-scope ytd-logo"></polygon>
              </g>
            </g>
          </svg>
        </div>
        <div class="mytube-search-container" onclick="document.querySelector('button.header-search-icon, .header-search-icon').click()">
          <svg class="mytube-search-icon" viewBox="0 0 24 24">
            <path fill="#606060" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
          </svg>
          <div class="mytube-search-placeholder">Search YouTube</div>
        </div>
        <div class="mytube-home-card">
          <div class="mytube-card-title">Try searching to get started</div>
          <div class="mytube-card-text">Start watching videos to help us build a feed of videos you'll love.</div>
        </div>
      `;
      document.body.appendChild(container);
    }

    function removeMinimalistHome() {
      const el = document.getElementById('mytube-minimalist-home');
      if (el) el.remove();
    }

    // Toggle watch and home mode class based on URL
    const updateWatchMode = () => {
      const path = window.location.pathname;
      
      // Home mode detection
      if (path === '/' || path === '/index.html') {
        if (!document.body.classList.contains('mytube-home-mode')) {
          document.body.classList.add('mytube-home-mode');
          console.log('🦦 Home mode activated');
        }
        injectMinimalistHome();
      } else {
        if (document.body.classList.contains('mytube-home-mode')) {
          document.body.classList.remove('mytube-home-mode');
          console.log('🦦 Home mode deactivated');
        }
        removeMinimalistHome();
      }

      // Watch mode detection
      if (path.startsWith('/watch')) {
        if (!document.body.classList.contains('mytube-watch-mode')) {
          document.body.classList.add('mytube-watch-mode');
          console.log('🦦 Watch mode activated');
        }
      } else {
        if (document.body.classList.contains('mytube-watch-mode')) {
          document.body.classList.remove('mytube-watch-mode');
          console.log('🦦 Watch mode deactivated');
        }
      }
    };

    // Initial check
    updateWatchMode();

    // Watch for URL changes via history API
    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      updateWatchMode();
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      updateWatchMode();
    };

    window.addEventListener('popstate', updateWatchMode);
    
    // Also check on mutation since YouTube uses soft navigation
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        updateWatchMode();
      }
    });

    const titleEl = document.querySelector('title');
    if (titleEl) {
      urlObserver.observe(titleEl, {
        childList: true,
        subtree: true
      });
    }
  }

  // Prevent "Are you still watching?" popup
  setInterval(() => {
    window._lact = Date.now();
  }, 60 * 1000);

  // Initialize
  injectCSS();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAdSkipper);
  } else {
    setupAdSkipper();
  }

  console.log('🦦 MyTube Ad-Blocker Loaded!');
})();
