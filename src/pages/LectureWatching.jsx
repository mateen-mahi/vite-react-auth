// Lectures.jsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";  // 👈 added
import { FiCheckCircle, FiCircle, FiClock, FiPlayCircle } from "react-icons/fi";
import "../styles/lectures.css";

const WATCH_THRESHOLD = 0.3; // 30%
const STORAGE_KEY = "academy_watched_lectures";

// ─── Load / Save helpers (unchanged) ──────────────────────
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

// ─── YouTube IFrame API loader (unchanged) ─────────────────
let ytApiLoaded = false;
const loadYTApi = () => {
  if (ytApiLoaded || window.YT) return;
  ytApiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(tag);
};

// ─── Helper: convert minutes (number) to "mm:ss" ──────────
const formatDuration = (minutes) => {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function Lectures() {
  const { courseId } = useParams(); // 👈 from URL

  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeLecture, setActiveLecture] = useState(null);
  const [watched, setWatched] = useState(loadWatched);
  const [progress, setProgress] = useState(0);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const markedRef = useRef({});

  // ── Fetch lectures for this course ───────────────────────
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/lectures/course/${courseId}`);
        if (!res.ok) throw new Error("Failed to fetch lectures");
        const data = await res.json();
        // data.data is the array of lectures (from your API sample)
        const lecturesData = data.data || [];
        // Map to the shape expected by the component
        const mapped = lecturesData.map((lec) => ({
          id: lec.id,
          title: lec.title,
          description: lec.description,
          duration: formatDuration(lec.duration), // convert to "mm:ss"
          videoId: lec.videoId,
        }));
        setLectures(mapped);
        // Set first lecture as active
        if (mapped.length > 0) setActiveLecture(mapped[0]);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchLectures();
  }, [courseId]);

  // ── Bootstrap YouTube API (unchanged) ─────────────────────
  useEffect(() => {
    loadYTApi();
  }, []);

  // ── Create player when activeLecture changes ──────────────
  useEffect(() => {
    if (!activeLecture) return;

    clearInterval(intervalRef.current);
    setProgress(0);

    const createPlayer = () => {
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

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLecture?.id]);

  // ── Polling (unchanged) ──────────────────────────────────
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
    if (lecture.id === activeLecture?.id) return;
    setActiveLecture(lecture);
  };

  // ── Loading / Error states ──────────────────────────────
  if (loading) {
    return <div className="lectures-page"><p>Loading lectures…</p></div>;
  }

  if (error) {
    return <div className="lectures-page"><p>Error: {error}</p></div>;
  }

  if (!lectures.length) {
    return <div className="lectures-page"><p>No lectures found for this course.</p></div>;
  }

  const watchedCount = Object.keys(watched).filter(id => watched[id]).length;

  // ── Render (same JSX, but data from state) ──────────────
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
          <span className="lp-badge-label">/ {lectures.length} completed</span>
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

        {lectures.map((lec, index) => {
          const isActive = lec.id === activeLecture.id;
          const isWatched = !!watched[lec.id];

          return (
            <button
              key={lec.id}
              className={`lp-card ${isActive ? "active" : ""} ${isWatched ? "done" : ""}`}
              onClick={() => handleSelect(lec)}
            >
              <div className="lp-card-num">{index + 1}</div>
              <div className="lp-card-body">
                <p className="lp-card-title">{lec.title}</p>
                <p className="lp-card-desc">{lec.description}</p>
              </div>
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