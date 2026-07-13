// QuizPage.jsx (GrandQuiz)
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api"; // adjust to your API client
import {
  FiClock,
  FiAward,
  FiChevronRight,
  FiChevronLeft,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import "../styles/QuizPage.css";

// ─── Helpers ───────────────────────────────────────────────
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const getScoreLabel = (percent) => {
  if (percent >= 90) return { label: "Excellent!", color: "score-excellent" };
  if (percent >= 70) return { label: "Good Job!", color: "score-good" };
  if (percent >= 50) return { label: "Keep Practicing", color: "score-average" };
  return { label: "Needs Improvement", color: "score-poor" };
};

const SCREEN = { INTRO: "intro", QUIZ: "quiz", RESULT: "result" };

export default function GrandQuiz() {
  const { courseId } = useParams();

  // ── State ────────────────────────────────────────────────
  const [quizData, setQuizData] = useState(null);       // fetched quiz object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [screen, setScreen] = useState(SCREEN.INTRO);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef(null);

  // ── Fetch quiz ──────────────────────────────────────────
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quizzes/course/${courseId}`);
        const data = res.data;
        // API returns { success: true, data: [ quizObject ] }
        const quiz = data.data?.[0];
        if (!quiz) {
          setError("No quiz found for this course");
          return;
        }
        // Map questions: add an 'id' field (index) and ensure 'correct' exists
        const mappedQuestions = quiz.questions.map((q, idx) => ({
          id: idx + 1, // or use a unique id if provided
          question: q.question,
          options: q.options,
          correct: q.correct ?? 0, // fallback to 0 if missing (adjust as needed)
        }));
        setQuizData({
          ...quiz,
          questions: mappedQuestions,
          totalTime: quiz.totalTime * 60, // convert minutes to seconds
        });
        setTimeLeft(quiz.totalTime * 60);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchQuiz();
  }, [courseId]);

  // ── Timer ────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== SCREEN.QUIZ || !quizData) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, quizData]);

  // ── Restore answer on navigation ────────────────────────
  useEffect(() => {
    if (!quizData) return;
    const q = quizData.questions[current];
    setSelected(answers[q.id] ?? null);
  }, [current, answers, quizData]);

  // ── Handlers ─────────────────────────────────────────────
  const handleSelect = (idx) => {
    if (submitted) return;
    setSelected(idx);
    const q = quizData.questions[current];
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
  };

  const handleNext = () => {
    if (current < quizData.questions.length - 1) setCurrent((c) => c + 1);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const handleSubmit = (auto = false) => {
    clearInterval(timerRef.current);
    setSubmitted(true);
    setScreen(SCREEN.RESULT);
  };

  const handleRestart = () => {
    setScreen(SCREEN.INTRO);
    setCurrent(0);
    setAnswers({});
    setSelected(null);
    setTimeLeft(quizData.totalTime);
    setSubmitted(false);
  };

  // ── Loading / Error ──────────────────────────────────────
  if (loading) {
    return <div className="gq-page"><p>Loading quiz…</p></div>;
  }
  if (error) {
    return <div className="gq-page"><p>Error: {error}</p></div>;
  }
  if (!quizData) {
    return <div className="gq-page"><p>No quiz available for this course.</p></div>;
  }

  // ── Derived values ──────────────────────────────────────
  const total = quizData.questions.length;
  const question = quizData.questions[current];
  const score = quizData.questions.reduce((acc, q) => {
    return answers[q.id] === q.correct ? acc + 1 : acc;
  }, 0);
  const percent = Math.round((score / total) * 100);
  const scoreInfo = getScoreLabel(percent);
  const answered = Object.keys(answers).length;
  const progress = ((current + 1) / total) * 100;
  const isLowTime = timeLeft <= 60;

  // ════════════════════════════════════════════════════════
  // INTRO SCREEN
  // ════════════════════════════════════════════════════════
  if (screen === SCREEN.INTRO) {
    return (
      <div className="gq-page">
        <div className="gq-intro-card">
          <div className="gq-intro-icon">
            <FiAward />
          </div>
          <p className="gq-intro-subject">{quizData.subject}</p>
          <h1 className="gq-intro-title">{quizData.title}</h1>
          <p className="gq-intro-subtitle">Grand Quiz</p>

          <div className="gq-intro-stats">
            <div className="gq-stat">
              <span className="gq-stat-value">{total}</span>
              <span className="gq-stat-label">Questions</span>
            </div>
            <div className="gq-stat-divider" />
            <div className="gq-stat">
              <span className="gq-stat-value">{quizData.totalTime / 60}</span>
              <span className="gq-stat-label">Minutes</span>
            </div>
            <div className="gq-stat-divider" />
            <div className="gq-stat">
              <span className="gq-stat-value">1</span>
              <span className="gq-stat-label">Point each</span>
            </div>
          </div>

          <ul className="gq-rules">
            <li><FiCheckCircle className="gq-rule-icon" /> Each question has one correct answer.</li>
            <li><FiCheckCircle className="gq-rule-icon" /> You can navigate back and change answers.</li>
            <li><FiAlertCircle className="gq-rule-icon warn" /> Quiz auto-submits when time runs out.</li>
          </ul>

          <button className="gq-btn-start" onClick={() => setScreen(SCREEN.QUIZ)}>
            Start Quiz <FiChevronRight />
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // RESULT SCREEN
  // ════════════════════════════════════════════════════════
  if (screen === SCREEN.RESULT) {
    return (
      <div className="gq-page">
        <div className="gq-result-card">
          <div className={`gq-result-score ${scoreInfo.color}`}>
            <span className="gq-result-percent">{percent}%</span>
            <span className="gq-result-label">{scoreInfo.label}</span>
          </div>

          <div className="gq-result-stats">
            <div className="gq-rstat correct">
              <FiCheckCircle />
              <span>{score} Correct</span>
            </div>
            <div className="gq-rstat wrong">
              <FiXCircle />
              <span>{total - score} Wrong</span>
            </div>
          </div>

          <p className="gq-result-summary">
            You answered {score} out of {total} questions correctly.
          </p>

          {/* Answer Review */}
          <div className="gq-review">
            <h3 className="gq-review-heading">Review Answers</h3>
            {quizData.questions.map((q, i) => {
              const chosen = answers[q.id];
              const isCorrect = chosen === q.correct;
              const isSkipped = chosen === undefined;
              return (
                <div
                  key={q.id}
                  className={`gq-review-item ${isCorrect ? "correct" : isSkipped ? "skipped" : "wrong"}`}
                >
                  <div className="gq-review-top">
                    <span className="gq-review-num">Q{i + 1}</span>
                    <p className="gq-review-q">{q.question}</p>
                    {isCorrect ? (
                      <FiCheckCircle className="gq-review-icon correct" />
                    ) : isSkipped ? (
                      <FiAlertCircle className="gq-review-icon skipped" />
                    ) : (
                      <FiXCircle className="gq-review-icon wrong" />
                    )}
                  </div>
                  {!isCorrect && (
                    <p className="gq-review-correct">
                      ✓ {q.options[q.correct]}
                    </p>
                  )}
                  {!isCorrect && !isSkipped && (
                    <p className="gq-review-chosen">
                      ✗ {q.options[chosen]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button className="gq-btn-restart" onClick={handleRestart}>
            <FiRefreshCw /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // QUIZ SCREEN
  // ════════════════════════════════════════════════════════
  return (
    <div className="gq-page">
      <div className="gq-quiz-card">
        {/* ── Top Bar ── */}
        <div className="gq-topbar">
          <div className="gq-topbar-left">
            <span className="gq-q-counter">
              Question <strong>{current + 1}</strong> / {total}
            </span>
            <span className="gq-answered-count">
              {answered} answered
            </span>
          </div>
          <div className={`gq-timer ${isLowTime ? "low" : ""}`}>
            <FiClock />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div className="gq-progress-track">
          <div className="gq-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* ── Question ── */}
        <div className="gq-question-area">
          <p className="gq-question-text">{question.question}</p>

          <div className="gq-options">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                className={`gq-option ${selected === idx ? "selected" : ""}`}
                onClick={() => handleSelect(idx)}
              >
                <span className="gq-option-letter">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="gq-option-text">{opt}</span>
                {selected === idx && (
                  <FiCheckCircle className="gq-option-check" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Question Dots ── */}
        <div className="gq-dots">
          {quizData.questions.map((q, i) => (
            <button
              key={q.id}
              className={`gq-dot ${i === current ? "active" : ""} ${answers[q.id] !== undefined ? "done" : ""}`}
              onClick={() => setCurrent(i)}
              title={`Question ${i + 1}`}
            />
          ))}
        </div>

        {/* ── Navigation ── */}
        <div className="gq-nav">
          <button
            className="gq-btn-nav"
            onClick={handlePrev}
            disabled={current === 0}
          >
            <FiChevronLeft /> Previous
          </button>

          {current < total - 1 ? (
            <button className="gq-btn-nav primary" onClick={handleNext}>
              Next <FiChevronRight />
            </button>
          ) : (
            <button
              className="gq-btn-submit"
              onClick={() => handleSubmit(false)}
            >
              Submit Quiz <FiAward />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}