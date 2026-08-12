import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext"; 
import { FiLoader, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { withTimeout } from "../utils/withTimeout";
import LectureProgressHeader from "../components/Lecture/LectureProgressHeader";
import LectureVideoPanel from "../components/Lecture/LectureVideoPanel";
import LectureList from "../components/Lecture/LectureList";
import "../styles/lectures.css";

const WATCH_THRESHOLD = 0.3;
const FETCH_TIMEOUT_MS = 15000;

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

export default function LectureWatching() {
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
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const markedRef = useRef({});
  const courseIdRef = useRef(courseId);
  courseIdRef.current = courseId;

  // ── Fetch lectures + this student's existing progress ────
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const lecRes = await withTimeout(api.get(`/lectures/course/${courseId}`), FETCH_TIMEOUT_MS, "Loading lectures");
        if (cancelled) return;

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

        // Progress is best-effort — a brand new student legitimately has none yet.
        try {
          const progRes = await withTimeout(api.get(`/progress/${courseId}`), FETCH_TIMEOUT_MS, "Loading progress");
          if (cancelled) return;
          const progressLectures = progRes.data?.progress?.lectures || [];
          const watchedMap = {};
          progressLectures.forEach((l) => {
            if (l.watched) watchedMap[idOf(l.lectureId)] = true;
          });
          setWatched(watchedMap);
          setOverallProgress(progRes.data?.progress?.overallProgress || 0);
          markedRef.current = { ...watchedMap };
        } catch {
          setWatched({});
          setOverallProgress(0);
          markedRef.current = {};
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load lectures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (courseId) fetchAll();
    return () => {
      cancelled = true;
    };
  }, [courseId, retryTick]);

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
    setPlayerReady(false);
    setPlayerError(null);

    const createPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // player was already torn down by the API itself — ignore
        }
        playerRef.current = null;
      }

      // The target div (#yt-player) must stay React-empty — see the note
      // in LectureVideoPanel.jsx for why.
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
            setPlayerReady(true);
            setPlayerError(null);
            startPolling();
            playerRef.current?.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) startPolling();
            if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
              clearInterval(intervalRef.current);
            }
          },
          onError: (e) => {
            const messages = {
              2: "Invalid video — check the video ID for this lecture.",
              5: "This video can't be played in the embedded player right now.",
              100: "This video was not found or is private.",
              101: "The video owner has disabled playback on other websites.",
              150: "The video owner has disabled playback on other websites.",
            };
            setPlayerError(messages[e.data] || "This video failed to load.");
            setPlayerReady(false);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => clearInterval(intervalRef.current);
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

  const handleNext = () => {
    const idx = lectures.findIndex((l) => l.id === activeLecture?.id);
    if (idx !== -1 && idx < lectures.length - 1) {
      setActiveLecture(lectures[idx + 1]);
    }
  };

  const handleRetry = () => setRetryTick((t) => t + 1);

  // ── Loading / Error ────────────────────────────────────────
  if (loading) {
    return (
      <div className="lw-page">
        <div className="lw-state">
          <FiLoader className="lw-spin" />
          <p>Loading lectures…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lw-page">
        <div className="lw-state lw-state-error">
          <FiAlertCircle />
          <p>{error}</p>
          <button className="lw-retry-btn" onClick={handleRetry}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!lectures.length) {
    return (
      <div className="lw-page">
        <div className="lw-state">
          <p>No lectures found for this course.</p>
        </div>
      </div>
    );
  }

  const watchedCount = Object.keys(watched).filter((id) => watched[id]).length;
  const activeIndex = lectures.findIndex((l) => l.id === activeLecture.id);

  return (
    <div className="lw-page">
      <LectureProgressHeader
        overallProgress={overallProgress}
        watchedCount={watchedCount}
        totalCount={lectures.length}
      />

      {syncError && <div className="lw-sync-error">{syncError}</div>}

      <LectureVideoPanel
        activeLecture={activeLecture}
        playerReady={playerReady}
        playerError={playerError}
        progress={progress}
        isWatched={!!watched[activeLecture.id]}
        syncing={syncing}
        onNext={handleNext}
        hasNext={activeIndex !== -1 && activeIndex < lectures.length - 1}
      />

      <LectureList
        lectures={lectures}
        activeId={activeLecture.id}
        watched={watched}
        onSelect={handleSelect}
      />
    </div>
  );
}