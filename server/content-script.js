// NouTube Content Script - Full Feature Ad Blocking for YouTube
// Ported from original NouTube: intercept.ts, css.ts, player.ts, sponsorblock.ts, dialogs.ts, menu.ts
(function() {
  'use strict';

  console.log('🦦 NouTube Loading...');

  // ==================== CONSTANTS ====================
  const AD_KEYS = ['adBreakHeartbeatParams', 'adPlacements', 'adSlots', 'playerAds'];
  const STORAGE_KEYS = {
    settings: 'nou:settings',
    videos: 'nou:videos:progress',
    videoProgress: (id) => `nou:progress:${id}`
  };

  // ==================== SETTINGS ====================
  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}');
    } catch { return {}; }
  }

  function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  // ==================== NOUTUBE GLOBAL ====================
  window.NouTube = {
    shortsHidden: getSettings().hideShorts || false,
    
    hideShorts() {
      if (document.getElementById('noutube-shorts')) return;
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
      const s = getSettings(); s.hideShorts = true; saveSettings(s);
    },
    
    showShorts() {
      document.getElementById('noutube-shorts')?.remove();
      this.shortsHidden = false;
      const s = getSettings(); s.hideShorts = false; saveSettings(s);
    },
    
    toggleShorts() {
      this.shortsHidden ? this.showShorts() : this.hideShorts();
    },

    // SponsorBlock settings
    get sponsorBlock() { return getSettings().sponsorBlock || false; },
    set sponsorBlock(v) { const s = getSettings(); s.sponsorBlock = v; saveSettings(s); },
    
    toggleSponsorBlock() {
      this.sponsorBlock = !this.sponsorBlock;
      console.log('🦦 SponsorBlock:', this.sponsorBlock ? 'ON' : 'OFF');
    },

    // Player controls
    play() { document.getElementById('movie_player')?.playVideo?.(); },
    pause() { document.getElementById('movie_player')?.pauseVideo?.(); },
    seekBy(delta) { document.getElementById('movie_player')?.seekBy?.(delta); },
    seekTo(time) { document.getElementById('movie_player')?.seekTo?.(time); },
  };

  // Initialize shorts setting
  if (window.NouTube.shortsHidden) {
    window.NouTube.hideShorts();
  }

  // ==================== CSS INJECTION ====================
  function injectCSS() {
    const style = document.createElement('style');
    style.id = 'noutube-css';
    style.textContent = `
      /* Hide ads */
      ytd-page-top-ad-layout-renderer,
      ytd-in-feed-ad-layout-renderer,
      ad-slot-renderer,
      yt-mealbar-promo-renderer,
      ytm-promoted-sparkles-web-renderer,
      .ytd-player-legacy-desktop-watch-ads-renderer,
      ytd-ad-slot-renderer,
      ytd-banner-promo-renderer,
      .ytp-ad-module,
      .ytp-ad-overlay-container,
      .video-ads,
      #player-ads,
      #masthead-ad {
        display: none !important;
      }

      /* Quick actions hide */
      .quick-actions-wrapper.enable-rtl-mirroring {
        display: none !important;
      }

      /* NouTube badge */
      #noutube-badge {
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.7);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  // ==================== FETCH/XHR INTERCEPTION ====================
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const request = args[0];
    const url = request instanceof Request ? request.url : request.toString();
    
    let response = await originalFetch.apply(this, args);
    
    // Intercept player API - remove ads
    if (url.includes('/youtubei/v1/player')) {
      try {
        const text = await response.clone().text();
        const data = JSON.parse(text);
        AD_KEYS.forEach(key => delete data[key]);
        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (e) {}
    }
    
    // Intercept search API - remove shorts if hidden
    if (url.includes('/youtubei/v1/search') && window.NouTube.shortsHidden) {
      try {
        const text = await response.clone().text();
        const data = JSON.parse(text);
        const transformed = transformSearchResponse(data);
        return new Response(JSON.stringify(transformed), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (e) {}
    }
    
    return response;
  };

  // Transform search to remove shorts
  function transformSearchResponse(data) {
    const sectionListRenderer = 
      data.contents?.sectionListRenderer ||
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer;
    
    const itemSectionRenderer = 
      sectionListRenderer?.contents?.[0]?.itemSectionRenderer ||
      data.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.itemSectionRenderer;

    if (itemSectionRenderer?.contents) {
      itemSectionRenderer.contents = itemSectionRenderer.contents.filter(item => {
        // Remove shorts and grid shelves
        if (item.gridShelfViewModel) return false;
        const url = item.videoWithContextRenderer?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;
        if (url?.startsWith('/shorts')) return false;
        return true;
      });
    }
    return data;
  }

  // XHR interception
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._noutubeUrl = url?.toString() || '';
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  const originalXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(...args) {
    if (this._noutubeUrl.includes('youtubei/v1/player')) {
      this.addEventListener('readystatechange', function() {
        if (this.readyState === 4 && this.status === 200) {
          try {
            const data = JSON.parse(this.responseText);
            AD_KEYS.forEach(key => delete data[key]);
            Object.defineProperty(this, 'responseText', { writable: true, value: JSON.stringify(data) });
            Object.defineProperty(this, 'response', { writable: true, value: JSON.stringify(data) });
          } catch (e) {}
        }
      });
    }
    return originalXHRSend.apply(this, args);
  };

  // ==================== SPONSORBLOCK ====================
  let skipSegments = { videoId: '', segments: [] };

  async function fetchSponsorSegments(videoId) {
    if (!window.NouTube.sponsorBlock) return { videoId, segments: [] };
    try {
      const res = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`);
      if (res.status === 200) {
        const segments = await res.json();
        console.log('🦦 SponsorBlock segments:', segments.length);
        return { videoId, segments };
      }
    } catch (e) {}
    return { videoId, segments: [] };
  }

  function checkSponsorSkip(currentTime, videoId) {
    if (!window.NouTube.sponsorBlock || videoId !== skipSegments.videoId) return;
    for (const segment of skipSegments.segments) {
      const [start, end] = segment.segment;
      if (currentTime > start && currentTime < end) {
        console.log('🦦 Skipping sponsor segment:', segment.category);
        window.NouTube.seekTo(end);
        return;
      }
    }
  }

  // ==================== VIDEO PROGRESS SAVING ====================
  let currentVideoId = '';
  let shouldSaveProgress = false;
  let progressRestored = false;

  function saveVideoProgress(videoId, currentTime) {
    if (!shouldSaveProgress || !progressRestored) return;
    localStorage.setItem(STORAGE_KEYS.videoProgress(videoId), currentTime.toString());
  }

  function restoreVideoProgress(videoId, duration) {
    shouldSaveProgress = duration > 600; // Only for videos > 10 min
    if (!shouldSaveProgress) return;
    
    const lastProgress = localStorage.getItem(STORAGE_KEYS.videoProgress(videoId));
    if (lastProgress) {
      const time = parseFloat(lastProgress);
      if (time > 10 && time < duration - 30) {
        console.log('🦦 Restoring progress:', time);
        window.NouTube.seekTo(time);
      }
    }
    progressRestored = true;
    
    // Track video in history
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.videos) || '[]');
      if (!history.includes(videoId)) {
        history.unshift(videoId);
        if (history.length > 100) {
          const removed = history.pop();
          localStorage.removeItem(STORAGE_KEYS.videoProgress(removed));
        }
        localStorage.setItem(STORAGE_KEYS.videos, JSON.stringify(history));
      }
    } catch (e) {}
  }

  // ==================== PLAYER HANDLING ====================
  let player = null;
  let progressInterval = null;

  function handlePlayer(moviePlayer) {
    if (player === moviePlayer) return;
    player = moviePlayer;
    console.log('🦦 Player detected');

    // Listen to state changes
    player.addEventListener('onStateChange', async (state) => {
      const response = player.getPlayerResponse?.();
      if (!response?.videoDetails) return;

      const { videoId, title, lengthSeconds } = response.videoDetails;
      const duration = parseInt(lengthSeconds) || 0;

      if (currentVideoId !== videoId) {
        currentVideoId = videoId;
        progressRestored = false;
        console.log('🦦 Now playing:', title);

        // Restore progress
        restoreVideoProgress(videoId, duration);

        // Fetch SponsorBlock segments
        skipSegments = await fetchSponsorSegments(videoId);
      }
    });

    // Progress tracking
    const video = player.querySelector('video');
    if (video) {
      video.addEventListener('timeupdate', () => {
        const currentTime = video.currentTime;
        saveVideoProgress(currentVideoId, currentTime);
        checkSponsorSkip(currentTime, currentVideoId);
      });
    }
  }

  // ==================== AD SKIPPING ====================
  function skipAds() {
    // Click skip buttons
    const skipSelectors = [
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button',
      '.videoAdUiSkipButton',
      '.ytp-ad-skip-button-container button',
      '[id*="skip-button"]'
    ];
    document.querySelectorAll(skipSelectors.join(',')).forEach(btn => btn.click?.());

    // Speed through unskippable ads
    const video = document.querySelector('video');
    const adShowing = document.querySelector('.ad-showing, .ytp-ad-player-overlay');
    if (video && adShowing) {
      video.playbackRate = 16;
      video.currentTime = video.duration || 999;
      video.muted = true;
    }

    // Remove overlays
    document.querySelectorAll(
      '.ytp-ad-overlay-container, .ytp-ad-text-overlay, .ytp-ad-overlay-slot, ' +
      '.ytp-ad-action-interstitial, .ytp-ad-overlay-close-button'
    ).forEach(el => el.remove?.());
  }

  // ==================== DIALOG HANDLING ====================
  function dismissDialogs() {
    const selectors = [
      '.dismiss-button',
      '[aria-label="Dismiss"]',
      'ytmusic-mealbar-promo-renderer .dismiss-button',
      'yt-mealbar-promo-renderer #dismiss-button',
      '#dismiss-button',
      'tp-yt-paper-dialog .dismiss-button'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(btn => btn.click?.());
  }

  // ==================== MUTATION OBSERVER ====================
  function initObserver() {
    const observer = new MutationObserver((mutations) => {
      skipAds();
      dismissDialogs();

      // Detect player
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.id === 'movie_player') {
            handlePlayer(node);
          }
        }
      }

      // Check if player exists
      const moviePlayer = document.getElementById('movie_player');
      if (moviePlayer && !player) {
        handlePlayer(moviePlayer);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // ==================== INITIALIZATION ====================
  function init() {
    injectCSS();
    initObserver();

    // Periodic checks
    setInterval(skipAds, 300);
    setInterval(dismissDialogs, 1000);

    // Keep session alive (prevent "are you still watching")
    setInterval(() => { window._lact = Date.now(); }, 60000);

    // Check for existing player
    const moviePlayer = document.getElementById('movie_player');
    if (moviePlayer) handlePlayer(moviePlayer);

    console.log('🦦 NouTube Ad Blocker Active!');
    console.log('   - Ad blocking: ON');
    console.log('   - Shorts hidden:', window.NouTube.shortsHidden);
    console.log('   - SponsorBlock:', window.NouTube.sponsorBlock);
    console.log('   - Progress saving: ON');
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
