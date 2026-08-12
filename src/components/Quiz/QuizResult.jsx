import { FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import "../../styles/QuizResult.css";

const getScoreLabel = (percent) => {
  if (percent >= 90) return { label: "Excellent!", color: "score-excellent" };
  if (percent >= 70) return { label: "Good Job!", color: "score-good" };
  if (percent >= 50) return { label: "Keep Practicing", color: "score-average" };
  return { label: "Needs Improvement", color: "score-poor" };
};

export default function QuizResult({
  quiz,
  answers,
  attemptResult,
  passThreshold,
  submitting,
  submitError,
  onRestart,
}) {
  const total = (quiz?.questions || []).length;
  const score = attemptResult?.correctAnswers ?? 0;
  const percent = attemptResult?.score ?? 0;
  const passed = attemptResult?.passed ?? false;
  const scoreInfo = getScoreLabel(percent);

  return (
    <div className="qr-card">
      <div className={`qr-pass-banner ${passed ? "passed" : "failed"}`}>
        {passed ? <FiCheckCircle /> : <FiXCircle />}
        <div>
          <p className="qr-pass-title">{passed ? "You passed!" : "Not quite — try again"}</p>
          <p className="qr-pass-sub">
            {passed
              ? `You scored ${percent}%, above the ${passThreshold}% pass mark.`
              : `You scored ${percent}%. You need ${passThreshold}% to pass.`}
          </p>
        </div>
      </div>

      <div className={`qr-score ${scoreInfo.color}`}>
        <span className="qr-score-percent">{percent}%</span>
        <span className="qr-score-label">{scoreInfo.label}</span>
      </div>

      <div className="qr-stats">
        <div className="qr-stat correct">
          <FiCheckCircle />
          <span>{score} Correct</span>
        </div>
        <div className="qr-stat wrong">
          <FiXCircle />
          <span>{total - score} Wrong</span>
        </div>
      </div>

      <p className="qr-summary">
        You answered {score} out of {total} questions correctly.
      </p>

      {submitting && <p className="qr-save-status">Saving your result…</p>}
      {submitError && <p className="qr-save-status qr-error-text">{submitError}</p>}

      <div className="qr-review">
        <h3 className="qr-review-heading">Review Answers</h3>
        {(quiz?.questions || []).map((q, i) => {
          const chosen = answers[q?.id];
          const isCorrect = chosen === q?.correct;
          const isSkipped = chosen === undefined;
          return (
            <div key={q?.id || i} className={`qr-review-item ${isCorrect ? "correct" : isSkipped ? "skipped" : "wrong"}`}>
              <div className="qr-review-top">
                <span className="qr-review-num">Q{i + 1}</span>
                <p className="qr-review-q">{q.question}</p>
                {isCorrect ? (
                  <FiCheckCircle className="qr-review-icon correct" />
                ) : isSkipped ? (
                  <FiAlertCircle className="qr-review-icon skipped" />
                ) : (
                  <FiXCircle className="qr-review-icon wrong" />
                )}
              </div>
              {!isCorrect && <p className="qr-review-correct">✓ {q.options[q?.correct]}</p>}
              {!isCorrect && !isSkipped && <p className="qr-review-chosen">✗ {q?.options?.[chosen]}</p>}
            </div>
          );
        })}
      </div>

      <button className={`qr-btn-restart ${!passed ? "qr-btn-retry" : ""}`} onClick={onRestart}>
        <FiRefreshCw /> {passed ? "Retake for Practice" : "Try Again"}
      </button>
    </div>
  );
}
