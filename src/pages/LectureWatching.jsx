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
const POLLING_INTERVAL_MS = 1000;

// ------------------------------------------------------------
// YouTube API
// ------------------------------------------------------------

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks = [];

const loadYTApi = (callback) => {
  // Already available
  if (window.YT?.Player) {
    callback();
    return;
  }

  // Add callback to queue
  ytApiCallbacks.push(callback);

  // Script is already loading
  if (ytApiLoading) {
    return;
  }

  ytApiLoading = true;

  // YouTube API callback
  window.onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true;
    ytApiLoading = false;

    const callbacks = [...ytApiCallbacks];
    ytApiCallbacks.length = 0;

    callbacks.forEach((cb) => {
      try {
        cb();
      } catch (error) {
        console.error("YouTube initialization error:", error);
      }
    });
  };

  // Script already exists in DOM
  const existingScript = document.querySelector(
    'script[src="https://www.youtube.com/iframe_api"]'
  );

  if (existingScript) {
    return;
  }

  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  script.async = true;

  document.body.appendChild(script);
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const formatDuration = (minutes) => {
  const value = Number(minutes);

  if (!Number.isFinite(value) || value < 0) {
    return "00:00";
  }

  let mins = Math.floor(value);
  let secs = Math.round((value - mins) * 60);

  // Handle cases like 4.999 minutes => 05:00
  if (secs >= 60) {
    mins += Math.floor(secs / 60);
    secs %= 60;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}`;
};

// Progress records can contain either:
//
// lectureId: "mongo-id"
//
// OR
//
// lectureId: { _id: "mongo-id", ... }
//
// Normalize both forms.
const idOf = (ref) => {
  if (!ref) return null;

  if (typeof ref === "object") {
    return ref._id ? String(ref._id) : null;
  }

  return String(ref);
};

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

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

  // ----------------------------------------------------------
  // Refs
  // ----------------------------------------------------------

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  // Prevent duplicate backend requests for the same lecture
  const markedRef = useRef({});

  // Always keep latest active lecture available to polling
  const activeLectureRef = useRef(null);

  // Keep latest course ID
  const courseIdRef = useRef(courseId);

  // Used to prevent callbacks from an old player affecting new player
  const playerGenerationRef = useRef(0);

  // Keep callback available even if component changes
  const markWatchedRef = useRef(null);

  // ----------------------------------------------------------
  // Keep refs synchronized
  // ----------------------------------------------------------

  useEffect(() => {
    courseIdRef.current = courseId;
  }, [courseId]);

  useEffect(() => {
    activeLectureRef.current = activeLecture;
  }, [activeLecture]);

  // ----------------------------------------------------------
  // Clear polling
  // ----------------------------------------------------------

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ----------------------------------------------------------
  // Fetch lectures + progress
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // ----------------------------------------------
        // Fetch lectures
        // ----------------------------------------------

        const lecRes = await withTimeout(
          api.get(`/lectures/course/${courseId}`),
          FETCH_TIMEOUT_MS,
          "Loading lectures"
        );

        if (cancelled) return;

        const lecturesData = lecRes.data?.data || [];

        const mapped = lecturesData.map((lec) => {
          const displayDuration =
            typeof lec.duration === "string" && lec.duration.includes(":")
              ? lec.duration
              : formatDuration(lec.duration);

          return {
            id: String(lec._id),
            title: lec.title || "Untitled Lecture",
            description: lec.description || "",
            duration: displayDuration,
            videoId: lec.videoId,
          };
        });

        setLectures(mapped);

        if (mapped.length > 0) {
          setActiveLecture(mapped[0]);
        } else {
          setActiveLecture(null);
        }

        // ----------------------------------------------
        // Fetch progress
        // ----------------------------------------------

        try {
          const progRes = await withTimeout(
            api.get(`/progress/${courseId}`),
            FETCH_TIMEOUT_MS,
            "Loading progress"
          );

          if (cancelled) return;

          const progressLectures =
            progRes.data?.progress?.lectures || [];

          const watchedMap = {};

          progressLectures.forEach((lectureProgress) => {
            if (!lectureProgress?.watched) return;

            const lectureId = idOf(lectureProgress.lectureId);

            if (lectureId) {
              watchedMap[lectureId] = true;
            }
          });

          setWatched(watchedMap);

          setOverallProgress(
            Number(progRes.data?.progress?.overallProgress) || 0
          );

          markedRef.current = { ...watchedMap };
        } catch (progressError) {
          // Progress is best-effort.
          // A new student may not have progress yet.
          console.warn(
            "Could not load lecture progress:",
            progressError
          );

          if (!cancelled) {
            setWatched({});
            setOverallProgress(0);
            markedRef.current = {};
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load lectures:", err);

          setError(
            err?.message || "Failed to load lectures."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (courseId) {
      fetchAll();
    }

    return () => {
      cancelled = true;
    };
  }, [courseId, retryTick]);

  // ----------------------------------------------------------
  // Real-time progress events
  // ----------------------------------------------------------

  useEffect(() => {
    if (!onEvent) return undefined;

    const offLecture = onEvent(
      "progress:lectureUpdated",
      (data) => {
        if (
          String(data?.courseId) !== String(courseId)
        ) {
          return;
        }

        const lectureId = idOf(data?.lectureId);

        if (!lectureId) return;

        markedRef.current[lectureId] = true;

        setWatched((prev) => ({
          ...prev,
          [lectureId]: true,
        }));

        if (data?.overallProgress != null) {
          setOverallProgress(
            Number(data.overallProgress) || 0
          );
        }
      }
    );

    const offCompleted = onEvent(
      "course:completed",
      (data) => {
        if (
          String(data?.courseId) !== String(courseId)
        ) {
          return;
        }

        setOverallProgress(100);
      }
    );

    return () => {
      if (typeof offLecture === "function") {
        offLecture();
      }

      if (typeof offCompleted === "function") {
        offCompleted();
      }
    };
  }, [onEvent, courseId]);

  // ----------------------------------------------------------
  // YouTube API bootstrap
  // ----------------------------------------------------------

  useEffect(() => {
    loadYTApi(() => {
      // API loaded.
      // Player effect will create the player when needed.
    });
  }, []);

  // ----------------------------------------------------------
  // Mark lecture watched
  // ----------------------------------------------------------

  const markWatched = useCallback(
    async (lectureId, lastPosition) => {
      const normalizedId = idOf(lectureId);

      if (!normalizedId) return;

      // Already successfully marked
      if (markedRef.current[normalizedId]) {
        return;
      }

      // Optimistically mark locally
      markedRef.current[normalizedId] = true;

      setWatched((prev) => ({
        ...prev,
        [normalizedId]: true,
      }));

      setSyncError(null);

      try {
        setSyncing(true);

        const res = await api.patch(
          `/progress/${courseIdRef.current}/lecture`,
          {
            lectureId: normalizedId,
            watched: true,
            lastPosition: Number(lastPosition) || 0,
          }
        );

        if (
          res.data?.progress?.overallProgress != null
        ) {
          setOverallProgress(
            Number(
              res.data.progress.overallProgress
            ) || 0
          );
        }
      } catch (err) {
        console.error(
          "Failed to sync lecture progress:",
          err
        );

        // Allow another attempt
        markedRef.current[normalizedId] = false;

        setWatched((prev) => {
          const next = { ...prev };
          delete next[normalizedId];
          return next;
        });

        setSyncError(
          "Couldn't save your progress. We'll retry automatically."
        );
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  // Keep latest callback in ref
  useEffect(() => {
    markWatchedRef.current = markWatched;
  }, [markWatched]);

  // ----------------------------------------------------------
  // Start polling
  // ----------------------------------------------------------

  const startPolling = useCallback(() => {
    stopPolling();

    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      const lecture = activeLectureRef.current;

      if (!player || !lecture) {
        return;
      }

      if (
        typeof player.getCurrentTime !== "function" ||
        typeof player.getDuration !== "function"
      ) {
        return;
      }

      let current;
      let total;

      try {
        current = Number(player.getCurrentTime());
        total = Number(player.getDuration());
      } catch {
        return;
      }

      if (
        !Number.isFinite(current) ||
        !Number.isFinite(total) ||
        total <= 0
      ) {
        return;
      }

      const ratio = Math.min(
        Math.max(current / total, 0),
        1
      );

      setProgress(ratio * 100);

      if (
        ratio >= WATCH_THRESHOLD &&
        !markedRef.current[lecture.id]
      ) {
        markWatchedRef.current?.(
          lecture.id,
          current
        );
      }
    }, POLLING_INTERVAL_MS);
  }, [stopPolling]);

  // ----------------------------------------------------------
  // YouTube player
  // ----------------------------------------------------------

  useEffect(() => {
    if (!activeLecture?.id) {
      return undefined;
    }

    let cancelled = false;

    stopPolling();

    setProgress(0);
    setPlayerReady(false);
    setPlayerError(null);

    // New player generation
    const generation =
      playerGenerationRef.current + 1;

    playerGenerationRef.current = generation;

    const destroyPlayer = () => {
      stopPolling();

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.warn(
            "YouTube player cleanup warning:",
            error
          );
        }

        playerRef.current = null;
      }
    };

    const createPlayer = () => {
      if (cancelled) return;

      if (
        !window.YT ||
        typeof window.YT.Player !== "function"
      ) {
        return;
      }

      const target = document.getElementById(
        "yt-player"
      );

      if (!target) {
        console.warn(
          "YouTube player target #yt-player was not found."
        );
        return;
      }

      destroyPlayer();

      if (cancelled) return;

      try {
        playerRef.current = new window.YT.Player(
          "yt-player",
          {
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
                if (
                  cancelled ||
                  generation !==
                    playerGenerationRef.current
                ) {
                  return;
                }

                setPlayerReady(true);
                setPlayerError(null);

                // Do NOT autoplay.
                // Polling starts only when the user presses Play.
              },

              onStateChange: (event) => {
                if (
                  cancelled ||
                  generation !==
                    playerGenerationRef.current
                ) {
                  return;
                }

                if (
                  event.data ===
                  window.YT.PlayerState.PLAYING
                ) {
                  startPolling();
                }

                if (
                  event.data ===
                    window.YT.PlayerState.PAUSED ||
                  event.data ===
                    window.YT.PlayerState.ENDED
                ) {
                  stopPolling();
                }
              },

              onError: (event) => {
                if (
                  cancelled ||
                  generation !==
                    playerGenerationRef.current
                ) {
                  return;
                }

                const messages = {
                  2: "Invalid video — check the video ID for this lecture.",
                  5: "This video can't be played in the embedded player right now.",
                  100: "This video was not found or is private.",
                  101: "The video owner has disabled playback on other websites.",
                  150: "The video owner has disabled playback on other websites.",
                };

                setPlayerError(
                  messages[event.data] ||
                    "This video failed to load."
                );

                setPlayerReady(false);

                stopPolling();
              },
            },
          }
        );
      } catch (error) {
        console.error(
          "Failed to create YouTube player:",
          error
        );

        setPlayerError(
          "Failed to initialize the video player."
        );

        setPlayerReady(false);
      }
    };

    // API already available
    if (
      window.YT &&
      typeof window.YT.Player === "function"
    ) {
      createPlayer();
    } else {
      // Wait for API
      loadYTApi(createPlayer);
    }

    return () => {
      cancelled = true;

      stopPolling();

      playerGenerationRef.current += 1;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }

        playerRef.current = null;
      }
    };
  }, [
    activeLecture?.id,
    activeLecture?.videoId,
    startPolling,
    stopPolling,
  ]);

  // ----------------------------------------------------------
  // Lecture selection
  // ----------------------------------------------------------

  const handleSelect = useCallback(
    (lecture) => {
      if (!lecture?.id) return;

      if (lecture.id === activeLecture?.id) {
        return;
      }

      setActiveLecture(lecture);
      setSyncError(null);
    },
    [activeLecture?.id]
  );

  // ----------------------------------------------------------
  // Next lecture
  // ----------------------------------------------------------

  const handleNext = useCallback(() => {
    if (!activeLecture) return;

    const index = lectures.findIndex(
      (lecture) =>
        lecture.id === activeLecture.id
    );

    if (
      index !== -1 &&
      index < lectures.length - 1
    ) {
      setActiveLecture(lectures[index + 1]);
    }
  }, [activeLecture, lectures]);

  // ----------------------------------------------------------
  // Retry
  // ----------------------------------------------------------

  const handleRetry = useCallback(() => {
    setRetryTick((tick) => tick + 1);
  }, []);

  // ----------------------------------------------------------
  // Loading state
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // Error state
  // ----------------------------------------------------------

  if (error) {
    return (
      <div className="lw-page">
        <div className="lw-state lw-state-error">
          <FiAlertCircle />

          <p>{error}</p>

          <button
            className="lw-retry-btn"
            onClick={handleRetry}
          >
            <FiRefreshCw />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // No lectures
  // ----------------------------------------------------------

  if (!lectures.length || !activeLecture) {
    return (
      <div className="lw-page">
        <div className="lw-state">
          <p>No lectures found for this course.</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Derived values
  // ----------------------------------------------------------

  const watchedCount = Object.keys(watched).filter(
    (id) => watched[id]
  ).length;

  const activeIndex = lectures.findIndex(
    (lecture) =>
      lecture.id === activeLecture.id
  );

  const hasNext =
    activeIndex !== -1 &&
    activeIndex < lectures.length - 1;

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="lw-page">
      <LectureProgressHeader
        overallProgress={overallProgress}
        watchedCount={watchedCount}
        totalCount={lectures.length}
      />

      {syncError && (
        <div className="lw-sync-error">
          {syncError}
        </div>
      )}

      <LectureVideoPanel
        activeLecture={activeLecture}
        playerReady={playerReady}
        playerError={playerError}
        progress={progress}
        isWatched={!!watched[activeLecture.id]}
        syncing={syncing}
        onNext={handleNext}
        hasNext={hasNext}
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