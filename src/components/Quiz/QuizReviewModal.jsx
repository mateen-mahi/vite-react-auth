import { FiAlertCircle, FiFlag, FiX } from "react-icons/fi";
import "../../styles/QuizReviewModal.css";

export default function QuizReviewModal({ unansweredIndexes, flaggedIndexes, onJump, onClose }) {
  return (
    <div className="qrm-backdrop" role="dialog" aria-modal="true">
      <div className="qrm-card">
        <div className="qrm-header">
          <h3 className="qrm-title">
            <FiAlertCircle /> Not quite ready to submit
          </h3>
          <button className="qrm-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <p className="qrm-sub">
          Every question needs an answer, and no question can be left flagged, before you can submit.
        </p>

        {unansweredIndexes.length > 0 && (
          <div className="qrm-section">
            <p className="qrm-section-title">
              {unansweredIndexes.length} unanswered question{unansweredIndexes.length > 1 ? "s" : ""}
            </p>
            <div className="qrm-chip-row">
              {unansweredIndexes.map((i) => (
                <button key={i} className="qrm-chip qrm-chip-unanswered" onClick={() => onJump(i)}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {flaggedIndexes.length > 0 && (
          <div className="qrm-section">
            <p className="qrm-section-title">
              <FiFlag /> {flaggedIndexes.length} flagged question{flaggedIndexes.length > 1 ? "s" : ""} to recheck
            </p>
            <div className="qrm-chip-row">
              {flaggedIndexes.map((i) => (
                <button key={i} className="qrm-chip qrm-chip-flagged" onClick={() => onJump(i)}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="qrm-close-btn" onClick={onClose}>
          Keep working
        </button>
      </div>
    </div>
  );
}
