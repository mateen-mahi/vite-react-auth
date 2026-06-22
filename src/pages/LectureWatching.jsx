import React, { useEffect, useState, useRef } from 'react';
import '../styles/LectureWatching.css';

export default function BestYouTubeTracker() {
  const [isWatched30Percent, setIsWatched30Percent] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  
  // Yahan apni YouTube Video ki ID dalein (URL nahi, sirf ID jo 'v=' ke baad hoti hai)
  const videoId = "dQw4w9WgXcQ"; 

  useEffect(() => {
    // 1. YouTube Iframe API Script ko page par load karna
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://youtube.com";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      // Jab API load ho jaye tab player create karna
      window.onYouTubeIframeAPIReady = createPlayer;
    } else {
      createPlayer();
    }

    function createPlayer() {
      // Pehle se bane player ko replace hone se bachane ke liye
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          'rel': 0,
          'modestbranding': 1
        },
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
    }

    // Component unmount hone par interval saaf karna
    return () => clearInterval(intervalRef.current);
  }, []);

  // 2. Video play ya pause hone par progress track karna
  const onPlayerStateChange = (event) => {
    // window.YT.PlayerState.PLAYING ka matlab hai video chal rahi hai (value = 1)
    if (event.data === window.YT.PlayerState.PLAYING) {
      startTracking();
    } else {
      stopTracking();
    }
  };

  // 3. Har second baad video ki percentage nikalne ka logic
  const startTracking = () => {
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getDuration) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        
        if (duration > 0) {
          const percentage = (currentTime / duration) * 100;
          setCurrentProgress(Math.round(percentage));

          // Agar 30% watch ho gayi ho
          if (percentage >= 30) {
            setIsWatched30Percent(true);
            clearInterval(intervalRef.current); // Target meet hone par check karna band
          }
        }
      }
    }, 1000); // Har 1 second (1000ms) baad check karega
  };

  const stopTracking = () => {
    clearInterval(intervalRef.current);
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <h1>Advanced YouTube Progress Tracker</h1>
      </header>

      <div className="dashboard-layout">
        {/* Left Side: Video Player */}
        <div className="player-column">
          <div className="video-responsive">
            <div id="youtube-player"></div>
          </div>
          <div className="progress-bar-wrapper">
            <p>Video Progress: {currentProgress}%</p>
          </div>
        </div>

        {/* Right Side: Status Badge */}
        <div className="status-column">
          {isWatched30Percent ? (
            <div className="badge success-badge">
              <span className="icon">✅</span>
              <div className="badge-text">
                <h3>Milestone Unlocked!</h3>
                <p>You have watched 30% of the video.</p>
              </div>
            </div>
          ) : (
            <div className="badge lock-badge">
              <span className="icon">🔒</span>
              <div className="badge-text">
                <h3>Content Locked</h3>
                <p>Watch 30% to get your green tick.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
