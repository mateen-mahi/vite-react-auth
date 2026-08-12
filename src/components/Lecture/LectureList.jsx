import { FiCheckCircle, FiCircle, FiClock } from "react-icons/fi";
import "../../styles/LectureList.css";

export default function LectureList({ lectures, activeId, watched, onSelect }) {
  return (
    <div className="ll-list">
      <h3 className="ll-heading">All Lectures</h3>
      {lectures.map((lec, index) => {
        // Changed lec.id to lec._id to match your MongoDB backend
        const isActive = lec._id === activeId;
        const isWatched = !!watched[lec._id];
        
        return (
          <button
            key={lec._id} // Changed to _id
            className={`ll-card ${isActive ? "active" : ""} ${isWatched ? "done" : ""}`}
            onClick={() => onSelect(lec)}
          >
            <div className="ll-card-num">{index + 1}</div>
            <div className="ll-card-body">
              <p className="ll-card-title">{lec.title}</p>
              <p className="ll-card-desc">{lec.description}</p>
            </div>
            <div className="ll-card-right">
              <span className="ll-card-duration">
                <FiClock /> {lec.duration || "00:00"}
              </span>
              {isWatched ? (
                <FiCheckCircle className="ll-check watched" />
              ) : (
                <FiCircle className="ll-check pending" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
