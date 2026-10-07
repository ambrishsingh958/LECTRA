import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const VideoPlayer = forwardRef(({
  videoId,
  onTimeUpdate,
  initialTime = 0,
  onReady,
  onPlayStateChange
}, ref) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Expose player controls to parent
  useImperativeHandle(ref, () => ({
    seekTo: (seconds, allowSeekAhead = true) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, allowSeekAhead);
      }
    },
    playVideo: () => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    },
    pauseVideo: () => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    },
    setPlaybackRate: (rate) => {
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        playerRef.current.setPlaybackRate(rate);
      }
    },
    getCurrentTime: () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        return playerRef.current.getCurrentTime();
      }
      return 0;
    },
    getDuration: () => {
      if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
        return playerRef.current.getDuration();
      }
      return 0;
    }
  }));

  // Start polling getCurrentTime every 250ms
  const startPolling = () => {
    stopPolling();
    pollTimerRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration() || 0;
          if (onTimeUpdate) {
            onTimeUpdate(currentTime, duration);
          }
        } catch (e) {
          // ignore transient iframe cross-origin race
        }
      }
    }, 250);
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!videoId) return;

    let isMounted = true;
    const playerElementId = `yt-player-${videoId}`;

    // Load YouTube IFrame API script if not present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.body.appendChild(tag);
    }

    const initPlayer = () => {
      if (!isMounted || !window.YT || !window.YT.Player) return;

      // Destroy existing instance if any
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) { }
      }

      try {
        playerRef.current = new window.YT.Player(playerElementId, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
            start: Math.floor(initialTime) || 0,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              if (initialTime > 0) {
                event.target.seekTo(initialTime, true);
              }
              if (onReady) {
                onReady(event.target);
              }
            },
            onStateChange: (event) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === window.YT.PlayerState.PLAYING) {
                startPolling();
                if (onPlayStateChange) onPlayStateChange(true);
              } else {
                stopPolling();
                if (onPlayStateChange) onPlayStateChange(false);
                // Send final tick
                if (playerRef.current && onTimeUpdate) {
                  try {
                    onTimeUpdate(playerRef.current.getCurrentTime(), playerRef.current.getDuration());
                  } catch (e) { }
                }
              }
            }
          }
        });
      } catch (err) {
        console.error('Failed to instantiate YouTube player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        initPlayer();
      };
    }

    return () => {
      isMounted = false;
      stopPolling();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) { }
      }
    };
  }, [videoId]);

  return (
    <div className="player-wrapper">
      <div id={`yt-player-${videoId}`} className="player-iframe" ref={containerRef} />
    </div>
  );
});

export default VideoPlayer;
