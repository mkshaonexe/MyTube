// NouTube Ad-Blocking Script for MyTube
(function() {
  'use strict';
  
  // Keys to remove from player response (ads)
  const AD_KEYS = ['adBreakHeartbeatParams', 'adPlacements', 'adSlots', 'playerAds'];
  
  // Transform player response to remove ads
  function transformPlayerResponse(text) {
    try {
      const data = JSON.parse(text);
      AD_KEYS.forEach(key => delete data[key]);
      return JSON.stringify(data);
    } catch(e) {
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
    } catch(e) {
      return text;
    }
  }
  
  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
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
    } catch(e) {
      console.error('MyTube fetch intercept error:', e);
    }
    return res;
  };
  
  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    const urlStr = url.toString();
    this.addEventListener('readystatechange', function() {
      if (urlStr.includes('youtubei/v1/player') && this.readyState === 4) {
        try {
          const text = transformPlayerResponse(this.responseText);
          Object.defineProperty(this, 'response', { writable: true });
          Object.defineProperty(this, 'responseText', { writable: true });
          this.response = this.responseText = text;
        } catch(e) {}
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
      a.yt-spec-button-shape-next[href*="premium"],
      ytm-pivot-bar-renderer[data-layer="top"],
      .ytm-pivot-bar-item-renderer[tab-id="FEmenu"],
      .ytp-paid-content-overlay,
      .ytm-feed-ad-unit-renderer,
      .ytm-ad-slot-renderer,
      /* Hide "Open App" button - specific selectors only */
      .mobile-topbar-header-content a[href*="youtube.app.link"],
      a[href*="youtube.app.link"],
      a[href*="redirect_to_app"],
      .ytm-open-app-pill-button-renderer,
      .ytm-autonav-toggle-button-renderer,
      /* Hide premium promos */
      ytm-mealbar-promo-renderer,
      ytm-statement-banner-renderer,
      /* Hide shorts on home */
      ytm-reel-shelf-renderer,
      ytd-rich-section-renderer,
      .ytGridShelfViewModelHost,
      /* Hide quick action buttons */
      .quick-actions-wrapper.enable-rtl-mirroring {
        display: none !important;
      }
      
      /* Make video player use full space when ads are hidden */
      .ad-showing video {
        visibility: visible !important;
      }
      .ad-showing .html5-video-container {
        display: block !important;
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
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
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
