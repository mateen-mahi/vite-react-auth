import "../../styles/LectureProgressHeader.css";

export default function LectureProgressHeader({ overallProgress, watchedCount, totalCount }) {
  return (
    <div className="lph-header">
      <div>
        <h1 className="lph-title">Lectures</h1>
        <p className="lph-subtitle">Watch at least 30% of a lecture to mark it complete.</p>
      </div>
      <div className="lph-right">
        <div className="lph-overall">
          <div className="lph-overall-track">
            <div className="lph-overall-fill" style={{ width: `${overallProgress}%` }} />
          </div>
          <span className="lph-overall-label">{overallProgress}% course progress</span>
        </div>
        <div className="lph-badge">
          <span className="lph-badge-count">{watchedCount}</span>
          <span className="lph-badge-label">/ {totalCount} completed</span>
        </div>
      </div>
    </div>
  );
}
