import { FiAward, FiChevronRight, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiFlag } from "react-icons/fi";
import "../../styles/QuizIntro.css";

export default function QuizIntro({ quiz, total, passThreshold, priorAttempt, onStart }) {
  return (
    <div className="qi-card">
      <div className="qi-icon">
        <FiAward />
      </div>
      <p className="qi-subject">{quiz?.subject || ""}</p>
      <h1 className="qi-title">{quiz?.title || "Quiz"}</h1>
      <p className="qi-subtitle">Grand Quiz</p>

      <div className="qi-stats">
        <div className="qi-stat">
          <span className="qi-stat-value">{total}</span>
          <span className="qi-stat-label">Questions</span>
        </div>
        <div className="qi-stat-divider" />
        <div className="qi-stat">
          <span className="qi-stat-value">{Math.floor((quiz?.totalTime || 0) / 60)}</span>
          <span className="qi-stat-label">Minutes</span>
        </div>
        <div className="qi-stat-divider" />
        <div className="qi-stat">
          <span className="qi-stat-value">{passThreshold}%</span>
          <span className="qi-stat-label">To pass</span>
        </div>
      </div>

      {priorAttempt && (
        <div className={`qi-prior ${priorAttempt.passed ? "passed" : "failed"}`}>
          {priorAttempt.passed ? <FiCheckCircle /> : <FiTrendingUp />}
          <span>
            Last attempt: <strong>{priorAttempt.score}%</strong>{" "}
            {priorAttempt.passed ? "— Passed" : `— Not yet, need ${passThreshold}%`}
          </span>
        </div>
      )}

      <ul className="qi-rules">
        <li><FiCheckCircle className="qi-rule-icon" /> Each question has one correct answer.</li>
        <li><FiCheckCircle className="qi-rule-icon" /> You can navigate back and forward freely.</li>
        <li><FiFlag className="qi-rule-icon flag" /> Flag a question to recheck it before submitting.</li>
        <li><FiAlertCircle className="qi-rule-icon warn" /> All questions must be answered and unflagged before you can submit.</li>
      </ul>

      <button className="qi-btn-start" onClick={onStart}>
        {priorAttempt ? "Retake Quiz" : "Start Quiz"} <FiChevronRight />
      </button>
    </div>
  );
}
