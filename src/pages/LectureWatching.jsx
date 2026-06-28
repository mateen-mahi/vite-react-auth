import { useEffect, useRef, useState } from "react";
import { FiCheckCircle, FiCircle, FiClock, FiPlayCircle } from "react-icons/fi";
import "../styles/Lectures.css";

// ─── Lecture Data ──────────────────────────────────────────
const LECTURES = [
  {
    id: 1,
    title: "Introduction to React",
    description: "What is React, why it exists, and how it differs from plain JS.",
    duration: "44:39",
    videoId: "WF_X7gyV-t8", // replace with any YouTube video ID
  },
  {
    id: 2,
    title: "JSX & Components",
    description: "Writing JSX, creating functional components, and passing props.",
    duration: "18:20",
    videoId: "k-CIW7odYKw",
  },
  {
    id: 3,
    title: "useState Hook",
    description: "Managing local state inside components with the useState hook.",
    duration: "15:10",
    videoId: "SqcY0GlETPk",
  },
  {
    id: 4,
    title: "useEffect Hook",
    description: "Side effects, dependency arrays, and cleanup functions explained.",
    duration: "20:05",
    videoId: "SqcY0GlETPk",
  },
  {
    id: 5,
    title: "React Router",
    description: "Client-side routing with React Router v6 — NavLink, Outlet, params.",
    duration: "22:30",
    videoId: "SqcY0GlETPk",
  },
];

const WATCH_THRESHOLD = 0.3; // 30%
const STORAGE_KEY = "academy_watched_lectures";

// ─── Load / Save helpers ───────────────────────────────────
const loadWatched = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const saveWatched = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// ─── YouTube IFrame API loader (loads once globally) ──────
let ytApiLoaded = false;
const loadYTApi = () => {
  if (ytApiLoaded || window.YT) return;
  ytApiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(tag);
};

export default function Lectures() {
  const [activeLecture, setActiveLecture] = useState(LECTURES[0]);
  const [watched, setWatched] = useState(loadWatched);
  const [progress, setProgress] = useState(0); // 0–100 for the progress bar

  const playerRef = useRef(null);       // YT.Player instance
  const intervalRef = useRef(null);     // polling interval
  const markedRef = useRef({});         // tracks what's been marked this session

  // ── Bootstrap YouTube API ────────────────────────────────
  useEffect(() => {
    loadYTApi();
  }, []);

  // ── Create / recreate player when active lecture changes ─
  useEffect(() => {
    // Clear previous polling
    clearInterval(intervalRef.current);
    setProgress(0);

    const createPlayer = () => {
      // Destroy old player if it exists
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player("yt-player", {
        videoId: activeLecture.videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => startPolling(),
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) startPolling();
            if (
              e.data === window.YT.PlayerState.PAUSED ||
              e.data === window.YT.PlayerState.ENDED
            ) {
              clearInterval(intervalRef.current);
            }
          },
        },
      });
    };

    // If API already ready, create immediately; else wait for callback
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLecture.id]);

  // ── Poll playback position every second ─────────────────
  const startPolling = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;

      const current = player.getCurrentTime();
      const total = player.getDuration();
      if (!total || total === 0) return;

      const ratio = current / total;
      setProgress(Math.min(ratio * 100, 100));

      // Mark as watched once threshold crossed (only once per lecture)
      if (ratio >= WATCH_THRESHOLD && !markedRef.current[activeLecture.id]) {
        markedRef.current[activeLecture.id] = true;
        setWatched((prev) => {
          const updated = { ...prev, [activeLecture.id]: true };
          saveWatched(updated);
          return updated;
        });
      }
    }, 1000);
  };

  // ── Switch lecture ───────────────────────────────────────
  const handleSelect = (lecture) => {
    if (lecture.id === activeLecture.id) return;
    setActiveLecture(lecture);
  };

  const watchedCount = Object.keys(watched).length;

  return (
    <div className="lectures-page">

      {/* ── Page Header ── */}
      <div className="lp-header">
        <div>
          <h1 className="lp-title">Lectures</h1>
          <p className="lp-subtitle">Watch at least 30% of a lecture to mark it complete.</p>
        </div>
        <div className="lp-progress-badge">
          <span className="lp-badge-count">{watchedCount}</span>
          <span className="lp-badge-label">/ {LECTURES.length} completed</span>
        </div>
      </div>

      {/* ── Video Player ── */}
      <div className="lp-player-wrapper">
        <div className="lp-player-box">
          <div id="yt-player" />
        </div>

        {/* Progress bar */}
        <div className="lp-bar-track">
          <div
            className={`lp-bar-fill ${watched[activeLecture.id] ? "watched" : ""}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="lp-player-meta">
          <div>
            <h2 className="lp-active-title">{activeLecture.title}</h2>
            <p className="lp-active-desc">{activeLecture.description}</p>
          </div>
          {watched[activeLecture.id] ? (
            <span className="lp-status-badge watched">
              <FiCheckCircle /> Watched
            </span>
          ) : (
            <span className="lp-status-badge pending">
              <FiPlayCircle /> In Progress
            </span>
          )}
        </div>
      </div>

      {/* ── Lecture List ── */}
      <div className="lp-list">
        <h3 className="lp-list-heading">All Lectures</h3>

        {LECTURES.map((lec, index) => {
          const isActive = lec.id === activeLecture.id;
          const isWatched = !!watched[lec.id];

          return (
            <button
              key={lec.id}
              className={`lp-card ${isActive ? "active" : ""} ${isWatched ? "done" : ""}`}
              onClick={() => handleSelect(lec)}
            >
              {/* Number */}
              <div className="lp-card-num">{index + 1}</div>

              {/* Text */}
              <div className="lp-card-body">
                <p className="lp-card-title">{lec.title}</p>
                <p className="lp-card-desc">{lec.description}</p>
              </div>

              {/* Right side */}
              <div className="lp-card-right">
                <span className="lp-card-duration">
                  <FiClock /> {lec.duration}
                </span>
                {isWatched ? (
                  <FiCheckCircle className="lp-check watched" />
                ) : (
                  <FiCircle className="lp-check pending" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}