import { FiFlag } from "react-icons/fi";
import "../../styles/QuizNavigatorBubbles.css";

export default function QuizNavigatorBubbles({ questions, current, answers, flagged, onJump }) {
  return (
    <div className="qnb-wrap">
      <div className="qnb-legend">
        <span className="qnb-legend-item"><i className="qnb-dot unanswered" /> Unanswered</span>
        <span className="qnb-legend-item"><i className="qnb-dot answered" /> Answered</span>
        <span className="qnb-legend-item"><i className="qnb-dot flagged" /> Flagged</span>
      </div>

      <div className="qnb-grid">
        {questions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined;
          const isFlagged = flagged.has(q.id);
          const isActive = i === current;

          const classes = [
            "qnb-bubble",
            isAnswered ? "answered" : "unanswered",
            isFlagged ? "flagged" : "",
            isActive ? "active" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button key={q.id} className={classes} onClick={() => onJump(i)} title={`Question ${i + 1}`}>
              {isFlagged && <FiFlag className="qnb-flag-icon" />}
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
