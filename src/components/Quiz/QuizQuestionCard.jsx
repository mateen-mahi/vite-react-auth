import { FiCheckCircle, FiFlag } from "react-icons/fi";
import "../../styles/QuizQuestionCard.css";

export default function QuizQuestionCard({ question, selected, onSelect, isFlagged, onToggleFlag }) {
  if (!question) {
    return <p className="qqc-text">Loading question…</p>;
  }

  return (
    <div className="qqc-area">
      <div className="qqc-top">
        <p className="qqc-text">{question.question}</p>
        <button
          className={`qqc-flag-btn ${isFlagged ? "flagged" : ""}`}
          onClick={onToggleFlag}
          title={isFlagged ? "Unflag this question" : "Flag this question to recheck later"}
        >
          <FiFlag /> {isFlagged ? "Flagged" : "Flag"}
        </button>
      </div>

      <div className="qqc-options">
        {question.options?.map((opt, idx) => (
          <button
            key={idx}
            className={`qqc-option ${selected === idx ? "selected" : ""}`}
            onClick={() => onSelect(idx)}
          >
            <span className="qqc-option-letter">{String.fromCharCode(65 + idx)}</span>
            <span className="qqc-option-text">{opt}</span>
            {selected === idx && <FiCheckCircle className="qqc-option-check" />}
          </button>
        ))}
      </div>
    </div>
  );
}
