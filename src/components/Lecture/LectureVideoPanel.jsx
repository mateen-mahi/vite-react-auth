import {
  FiCheckCircle,
  FiPlayCircle,
  FiLoader,
  FiChevronRight,
} from "react-icons/fi";
import "../../styles/LectureVideoPanel.css";

export default function LectureVideoPanel({
  activeLecture,
  playerReady,
  playerError,
  progress,
  isWatched,
  syncing,
  onNext,
  hasNext,
  playerContainerRef,
}) {
  return (
    <div className="lvp-wrapper">
      <div className="lvp-box">
        {/* 
          IMPORTANT:
          YouTube IFrame API takes ownership of this element.
          Do not put React children inside it.
        */}
        <div
          id="yt-player"
          ref={playerContainerRef}
        />

        {!playerReady && !playerError && (
          <div className="lvp-overlay">
            <FiLoader className="lvp-spin" />
            <span>Loading player…</span>
          </div>
        )}

        {playerError && (
          <div className="lvp-overlay lvp-overlay-error">
            <span>{playerError}</span>
          </div>
        )}
      </div>

      <div className="lvp-bar-track">
        <div
          className={`lvp-bar-fill ${
            isWatched ? "watched" : ""
          }`}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="lvp-meta">
        <div className="lvp-meta-text">
          <h2 className="lvp-active-title">
            {activeLecture.title}
          </h2>

          <p className="lvp-active-desc">
            {activeLecture.description}
          </p>
        </div>

        <div className="lvp-meta-actions">
          {isWatched ? (
            <span className="lvp-status-badge watched">
              <FiCheckCircle />
              Watched
            </span>
          ) : (
            <span className="lvp-status-badge pending">
              {syncing ? (
                <FiLoader className="lvp-spin" />
              ) : (
                <FiPlayCircle />
              )}

              {syncing ? "Saving…" : "In Progress"}
            </span>
          )}

          {hasNext && (
            <button
              className="lvp-next-btn"
              onClick={onNext}
            >
              Next Lecture
              <FiChevronRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}