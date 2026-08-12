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

// ============================================================
// YouTube IFrame API
// ============================================================

let youtubeApiPromise = null;

const loadYTApi = () => {
  // Already loaded
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  // Already loading
  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === "function") {
        previousCallback();
      }

      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(
          new Error(
            "YouTube API loaded but Player is unavailable."
          )
        );
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");

      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;

      script.onerror = () => {
        reject(
          new Error("Failed to load YouTube IFrame API.")
        );
      };

      document.body.appendChild(script);
    }

    // Safety timeout
    setTimeout(() => {
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(
          new Error("YouTube API loading timed out.")
        );
      }
    }, 15000);
  });

  return youtubeApiPromise;
};

// ============================================================
// Helpers
// ============================================================

const formatDuration = (minutes) => {
  const value = Number(minutes);

  if (!Number.isFinite(value) || value < 0) {
    return "00:00";
  }

  let mins = Math.floor(value);
  let secs = Math.round((value - mins) * 60);

  if (secs >= 60) {
    mins += Math.floor(secs / 60);
    secs %= 60;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}`;
};

// Normalize lecture IDs whether populated or raw
const idOf = (ref) => {
  if (!ref) return null;

  if (typeof ref === "object") {
    return ref._id ? String(ref._id) : null;
  }

  return String(ref);
};

// ============================================================
// Component
// ============================================================

export default function LectureWatching() {
  const { courseId } = useParams();
  const { onEvent } = useAuth();

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

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

  // Lectures already marked watched
  const markedRef = useRef({});

  // Always keep latest lecture available to polling
  const activeLectureRef = useRef(null);

  // Always keep latest course ID
  const courseIdRef = useRef(courseId);

  // Latest markWatched function
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

  // ==========================================================
  // Stop polling
  // ==========================================================

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ==========================================================
  // Fetch lectures and progress
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // ----------------------------------------------------
        // Fetch lectures
        // ----------------------------------------------------

        const lecRes = await withTimeout(
          api.get(`/lectures/course/${courseId}`),
          FETCH_TIMEOUT_MS,
          "Loading lectures"
        );

        if (cancelled) return;

        const lecturesData = lecRes.data?.data || [];

        const mapped = lecturesData.map((lec) => {
          const displayDuration =
            typeof lec.duration === "string" &&
            lec.duration.includes(":")
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

        // ----------------------------------------------------
        // Fetch progress
        // ----------------------------------------------------

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

            const lectureId = idOf(
              lectureProgress.lectureId
            );

            if (lectureId) {
              watchedMap[lectureId] = true;
            }
          });

          setWatched(watchedMap);

          setOverallProgress(
            Number(
              progRes.data?.progress?.overallProgress
            ) || 0
          );

          markedRef.current = {
            ...watchedMap,
          };
        } catch (progressError) {
          // Progress is best effort
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
          console.error(
            "Failed to load lectures:",
            err
          );

          setError(
            err?.message ||
              "Failed to load lectures."
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

  // ==========================================================
  // Real-time progress events
  // ==========================================================

  useEffect(() => {
    if (!onEvent) {
      return undefined;
    }

    const offLecture = onEvent(
      "progress:lectureUpdated",
      (data) => {
        if (
          String(data?.courseId) !==
          String(courseId)
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
          String(data?.courseId) !==
          String(courseId)
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

  // ==========================================================
  // Mark lecture watched
  // ==========================================================

  const markWatched = useCallback(
    async (lectureId, lastPosition) => {
      const normalizedId = idOf(lectureId);

      if (!normalizedId) return;

      // Already marked
      if (markedRef.current[normalizedId]) {
        return;
      }

      // Optimistic UI update
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
            lastPosition:
              Number(lastPosition) || 0,
          }
        );

        if (
          res.data?.progress?.overallProgress !=
          null
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

        // Allow retry
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

  useEffect(() => {
    markWatchedRef.current = markWatched;
  }, [markWatched]);

  // ==========================================================
  // Start progress polling
  // ==========================================================

  const startPolling = useCallback(() => {
    stopPolling();

    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      const lecture = activeLectureRef.current;

      if (!player || !lecture) {
        return;
      }

      if (
        typeof player.getCurrentTime !==
          "function" ||
        typeof player.getDuration !==
          "function"
      ) {
        return;
      }

      let current;
      let total;

      try {
        current = Number(
          player.getCurrentTime()
        );

        total = Number(
          player.getDuration()
        );
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

      // Mark watched after 30%
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

  // ==========================================================
  // YouTube player
  // ==========================================================

  useEffect(() => {
    if (
      !activeLecture?.id ||
      !activeLecture?.videoId
    ) {
      setPlayerReady(false);
      setPlayerError(
        "This lecture does not have a valid YouTube video."
      );

      return undefined;
    }

    let cancelled = false;

    const initializePlayer = async () => {
      try {
        // Stop previous polling
        stopPolling();

        setProgress(0);
        setPlayerReady(false);
        setPlayerError(null);

        // ----------------------------------------------------
        // Wait for YouTube API
        // ----------------------------------------------------

        await loadYTApi();

        if (cancelled) return;

        // ----------------------------------------------------
        // Find player container
        // ----------------------------------------------------

        const target =
          document.getElementById(
            "yt-player"
          );

        if (!target) {
          throw new Error(
            "YouTube player container was not found."
          );
        }

        // ----------------------------------------------------
        // Destroy previous player
        // ----------------------------------------------------

        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            // Ignore cleanup error
          }

          playerRef.current = null;
        }

        // Make sure YouTube has a clean container
        target.innerHTML = "";

        console.log(
          "Creating YouTube player for:",
          activeLecture.videoId
        );

        // ----------------------------------------------------
        // Create player
        // ----------------------------------------------------

        playerRef.current =
          new window.YT.Player(
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
                // ------------------------------------------
                // Player ready
                // ------------------------------------------

                onReady: () => {
                  if (cancelled) return;

                  console.log(
                    "YouTube player ready"
                  );

                  setPlayerReady(true);
                  setPlayerError(null);

                  // Do NOT autoplay.
                  // User can press Play.
                },

                // ------------------------------------------
                // Player state
                // ------------------------------------------

                onStateChange: (event) => {
                  if (cancelled) return;

                  console.log(
                    "YouTube state:",
                    event.data
                  );

                  // Playing
                  if (
                    event.data ===
                    window.YT.PlayerState
                      .PLAYING
                  ) {
                    startPolling();
                  }

                  // Paused
                  if (
                    event.data ===
                      window.YT.PlayerState
                        .PAUSED ||
                    event.data ===
                      window.YT.PlayerState
                        .ENDED
                  ) {
                    stopPolling();
                  }
                },

                // ------------------------------------------
                // Player error
                // ------------------------------------------

                onError: (event) => {
                  if (cancelled) return;

                  console.error(
                    "YouTube player error:",
                    event.data
                  );

                  const messages = {
                    2: "Invalid YouTube video ID.",
                    5: "This video cannot be played in the embedded player.",
                    100: "Video not found or it is private.",
                    101: "The video owner has disabled embedding.",
                    150: "The video owner has disabled embedding.",
                  };

                  setPlayerError(
                    messages[event.data] ||
                      `YouTube player error: ${event.data}`
                  );

                  setPlayerReady(false);

                  stopPolling();
                },
              },
            }
          );
      } catch (error) {
        console.error(
          "Failed to initialize YouTube player:",
          error
        );

        if (!cancelled) {
          setPlayerReady(false);

          setPlayerError(
            error?.message ||
              "Failed to initialize video player."
          );
        }
      }
    };

    initializePlayer();

    // --------------------------------------------------------
    // Cleanup
    // --------------------------------------------------------

    return () => {
      cancelled = true;

      stopPolling();

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup error
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

  // ==========================================================
  // Select lecture
  // ==========================================================

  const handleSelect = useCallback(
    (lecture) => {
      if (!lecture?.id) return;

      if (
        lecture.id === activeLecture?.id
      ) {
        return;
      }

      setActiveLecture(lecture);
      setSyncError(null);
      setProgress(0);
    },
    [activeLecture?.id]
  );

  // ==========================================================
  // Next lecture
  // ==========================================================

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
      setActiveLecture(
        lectures[index + 1]
      );
    }
  }, [activeLecture, lectures]);

  // ==========================================================
  // Retry
  // ==========================================================

  const handleRetry = useCallback(() => {
    setRetryTick((tick) => tick + 1);
  }, []);

  // ==========================================================
  // Loading
  // ==========================================================

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

  // ==========================================================
  // Error
  // ==========================================================

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

  // ==========================================================
  // No lectures
  // ==========================================================

  if (
    !lectures.length ||
    !activeLecture
  ) {
    return (
      <div className="lw-page">
        <div className="lw-state">
          <p>
            No lectures found for this course.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Derived values
  // ==========================================================

  const watchedCount = Object.keys(
    watched
  ).filter((id) => watched[id]).length;

  const activeIndex = lectures.findIndex(
    (lecture) =>
      lecture.id === activeLecture.id
  );

  const hasNext =
    activeIndex !== -1 &&
    activeIndex <
      lectures.length - 1;

  // ==========================================================
  // Render
  // ==========================================================

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
        isWatched={
          !!watched[activeLecture.id]
        }
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