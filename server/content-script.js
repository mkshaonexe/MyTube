// NouTube Content Script - Ad Blocking for YouTube
(function() {
  'use strict';

  console.log('🦦 NouTube Ad Blocker Loading...');

  // Initialize NouTube global
  window.NouTube = {
    shortsHidden: false,
    hideShorts() {
      const style = document.createElement('style');
      style.id = 'noutube-shorts';
      style.textContent = `
        ytm-reel-shelf-renderer,
        ytd-rich-section-renderer,
        ytd-reel-shelf-renderer,
        [is-shorts],
        ytd-grid-video-renderer[is-shorts],
        .ytGridShelfViewModelHost {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      this.shortsHidden = true;
    },
    showShorts() {
      document.querySelector('style#noutube-shorts')?.remove();
      this.shortsHidden = false;
    },
    play() {
      document.getElementById('movie_player')?.playVideo?.();
    },
    pause() {
      document.getElementById('movie_player')?.pauseVideo?.();
    },
    seekBy(delta) {
      document.getElementById('movie_player')?.seekBy?.(delta);
    }
  };

  // Keys to remove from player API response
  const AD_KEYS = ['adBreakHeartbeatParams', 'adPlacements', 'adSlots', 'playerAds'];

  // Intercept fetch to remove ads from API responses
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const request = args[0];
    const url = request instanceof Request ? request.url : request.toString();
    
    // Let the request proceed
    let response = await originalFetch.apply(this, args);
    
    // Only intercept player API calls
    if (url.includes('/youtubei/v1/player')) {
      try {
        const clone = response.clone();
        const text = await clone.text();
        const data = JSON.parse(text);
        
        // Remove ad-related keys
        AD_KEYS.forEach(key => delete data[key]);
        
        // Return modified response
        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (e) {
        // Return original if parsing fails
        return response;
      }
    }
    
    return response;
  };

  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._noutubeUrl = url?.toString() || '';
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    if (this._noutubeUrl.includes('youtubei/v1/player')) {
      this.addEventListener('readystatechange', function() {
        if (this.readyState === 4 && this.status === 200) {
          try {
            const data = JSON.parse(this.responseText);
            AD_KEYS.forEach(key => delete data[key]);
            
            Object.defineProperty(this, 'responseText', {
              writable: true,
              value: JSON.stringify(data)
            });
            Object.defineProperty(this, 'response', {
              writable: true, 
              value: JSON.stringify(data)
            });
          } catch (e) {}
        }
      });
    }
    return originalXHRSend.apply(this, args);
  };

  // Aggressive ad skipping
  function skipAds() {
    // Click any skip button
    const skipButtons = document.querySelectorAll(
      '.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, ' +
      '.videoAdUiSkipButton, .ytp-ad-skip-button-container button'
    );
    skipButtons.forEach(btn => btn.click?.());
    
    // Handle video ads
    const video = document.querySelector('video');
    const adShowing = document.querySelector('.ad-showing, .ytp-ad-player-overlay');
    
    if (video && adShowing) {
      // Speed through ad
      video.playbackRate = 16;
      video.currentTime = video.duration || 999;
      video.muted = true;
    }
    
    // Remove ad overlays
    document.querySelectorAll(
      '.ytp-ad-overlay-container, .ytp-ad-text-overlay, ' +
      '.ytp-ad-overlay-slot, .ytp-ad-action-interstitial'
    ).forEach(el => {
      el.remove();
    });

    // Click close on any ad dialogs
    document.querySelectorAll(
      '.ytp-ad-overlay-close-button, [id*="dismiss-button"]'
    ).forEach(btn => btn.click?.());
  }

  // Handle promotional dialogs
  function dismissPromos() {
    const dismissButtons = document.querySelectorAll(
      '.dismiss-button, [aria-label="Dismiss"], ' +
      'ytmusic-mealbar-promo-renderer .dismiss-button, ' +
      'yt-mealbar-promo-renderer #dismiss-button'
    );
    dismissButtons.forEach(btn => btn.click?.());
  }

  // Observer for dynamic content
  function initObserver() {
    const observer = new MutationObserver(() => {
      skipAds();
      dismissPromos();
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Keep session alive to prevent "are you still watching" prompts
  setInterval(() => {
    window._lact = Date.now();
  }, 60000);

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    initObserver();
  }
  
  // Run ad skip check frequently
  setInterval(skipAds, 300);
  setInterval(dismissPromos, 1000);

  console.log('🦦 NouTube Ad Blocker Active!');
})();
