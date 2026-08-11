import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext"; 
import { FiCheckCircle, FiCircle, FiClock, FiPlayCircle, FiLoader } from "react-icons/fi";
import "../styles/lectures.css";

const WATCH_THRESHOLD = 0.3;

let ytApiLoaded = false;
const loadYTApi = () => {
  if (ytApiLoaded || window.YT) return;
  ytApiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(tag);
};

const formatDuration = (minutes) => {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// Progress records come back with lectureId either populated (object) or
// raw (string) depending on the endpoint — normalize either shape to an id.
const idOf = (ref) => (ref && typeof ref === "object" ? ref._id : ref);

export default function Lectures() {
  const { courseId } = useParams();
  const { onEvent } = useAuth();

  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);
  const [watched, setWatched] = useState({});
  const [progress, setProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const markedRef = useRef({});
  const courseIdRef = useRef(courseId);
  courseIdRef.current = courseId;

  // ── Fetch lectures + this student's existing progress ────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [lecRes, progRes] = await Promise.all([
          api.get(`/lectures/course/${courseId}`),
          api.get(`/progress/${courseId}`).catch(() => null),
        ]);

        const lecturesData = lecRes.data?.data || [];
        const mapped = lecturesData.map((lec) => ({
          id: lec.id,
          title: lec.title,
          description: lec.description,
          duration: formatDuration(lec.duration),
          videoId: lec.videoId,
        }));

        setLectures(mapped);
        if (mapped.length > 0) setActiveLecture(mapped[0]);

        const progressLectures = progRes?.data?.progress?.lectures || [];
        const watchedMap = {};
        progressLectures.forEach((l) => {
          if (l.watched) watchedMap[idOf(l.lectureId)] = true;
        });
        setWatched(watchedMap);
        setOverallProgress(progRes?.data?.progress?.overallProgress || 0);
        markedRef.current = { ...watchedMap };

        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchAll();
  }, [courseId]);

  // ── Real-time: pick up lecture-watched updates pushed from the backend —
  // covers this same account watching on another tab/device, so the UI here
  // updates without needing a page refresh.
  useEffect(() => {
    if (!onEvent) return;

    const offLecture = onEvent("progress:lectureUpdated", (data) => {
      if (String(data.courseId) !== String(courseId)) return;
      markedRef.current[data.lectureId] = true;
      setWatched((prev) => ({ ...prev, [data.lectureId]: true }));
      if (data.overallProgress != null) setOverallProgress(data.overallProgress);
    });

    const offCompleted = onEvent("course:completed", (data) => {
      if (String(data.courseId) !== String(courseId)) return;
      setOverallProgress(100);
    });

    return () => {
      offLecture();
      offCompleted();
    };
  }, [onEvent, courseId]);

  // ── YouTube API bootstrap ──────────────────────────────────
  useEffect(() => {
    loadYTApi();
  }, []);

  // ── Player ─────────────────────────────────────────────────
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
          autoplay: 0,
          controls: 1,
          mute: 0,
        },
        events: {
          onReady: () => {
            startPolling();
            playerRef.current?.playVideo();
          },
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

  // ── Mark a lecture watched on the backend (once per lecture) ─
  const markWatched = useCallback(async (lectureId, lastPosition) => {
    if (markedRef.current[lectureId]) return;
    markedRef.current[lectureId] = true;
    setWatched((prev) => ({ ...prev, [lectureId]: true }));
    setSyncError(null);

    try {
      setSyncing(true);
      const res = await api.patch(`/progress/${courseIdRef.current}/lecture`, {
        lectureId,
        watched: true,
        lastPosition,
      });
      if (res.data?.progress?.overallProgress != null) {
        setOverallProgress(res.data.progress.overallProgress);
      }
    } catch (err) {
      console.error("Failed to sync lecture progress:", err);
      // Roll back the optimistic mark so the UI matches what the server has.
      markedRef.current[lectureId] = false;
      setWatched((prev) => {
        const next = { ...prev };
        delete next[lectureId];
        return next;
      });
      setSyncError("Couldn't save your progress. It'll retry once you keep watching.");
    } finally {
      setSyncing(false);
    }
  }, []);

  // ── Polling ────────────────────────────────────────────────
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

      if (ratio >= WATCH_THRESHOLD && activeLecture && !markedRef.current[activeLecture.id]) {
        markWatched(activeLecture.id, current);
      }
    }, 1000);
  };

  const handleSelect = (lecture) => {
    if (lecture.id === activeLecture?.id) return;
    setActiveLecture(lecture);
  };

  // ── Loading / Error ────────────────────────────────────────
  if (loading) {
    return (
      <div className="lectures-page">
        <div className="lp-state">
          <FiLoader className="lp-spin" />
          <p>Loading lectures…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lectures-page">
        <div className="lp-state lp-state-error">
          <p>Something went wrong: {error}</p>
        </div>
      </div>
    );
  }

  if (!lectures.length) {
    return (
      <div className="lectures-page">
        <div className="lp-state">
          <p>No lectures found for this course.</p>
        </div>
      </div>
    );
  }

  const watchedCount = Object.keys(watched).filter((id) => watched[id]).length;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="lectures-page">
      <div className="lp-header">
        <div>
          <h1 className="lp-title">Lectures</h1>
          <p className="lp-subtitle">Watch at least 30% of a lecture to mark it complete.</p>
        </div>
        <div className="lp-header-right">
          <div className="lp-overall">
            <div className="lp-overall-track">
              <div className="lp-overall-fill" style={{ width: `${overallProgress}%` }} />
            </div>
            <span className="lp-overall-label">{overallProgress}% course progress</span>
          </div>
          <div className="lp-progress-badge">
            <span className="lp-badge-count">{watchedCount}</span>
            <span className="lp-badge-label">/ {lectures.length} completed</span>
          </div>
        </div>
      </div>

      {syncError && <div className="lp-sync-error">{syncError}</div>}

      <div className="lp-player-wrapper">
        <div className="lp-player-box">
          <div id="yt-player">
            {activeLecture?.videoId && (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeLecture.videoId}?rel=0&modestbranding=1&autoplay=0&mute=0`}
                title={activeLecture.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              />
            )}
          </div>
        </div>
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
              {syncing ? <FiLoader className="lp-spin" /> : <FiPlayCircle />}
              {syncing ? "Saving…" : "In Progress"}
            </span>
          )}
        </div>
      </div>

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