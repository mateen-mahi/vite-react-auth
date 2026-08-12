import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { FiClock, FiAward, FiChevronRight, FiChevronLeft, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { withTimeout } from "../utils/withTimeout";
import QuizIntro from "../components/Quiz/QuizIntro";
import QuizQuestionCard from "../components/Quiz/QuizQuestionCard";
import QuizNavigatorBubbles from "../components/Quiz/QuizNavigatorBubbles";
import QuizReviewModal from "../components/Quiz/QuizReviewModal";
import QuizResult from "../components/Quiz/QuizResult";
import "../styles/QuizPage.css";

const PASS_THRESHOLD = 70;
const FETCH_TIMEOUT_MS = 15000;

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const idOf = (ref) => (ref && typeof ref === "object" ? ref._id : ref);

const SCREEN = { INTRO: "intro", QUIZ: "quiz", RESULT: "result" };

export default function QuizPage() {
  const { courseId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  const [screen, setScreen] = useState(SCREEN.INTRO);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [attemptResult, setAttemptResult] = useState(null);
  const [priorAttempt, setPriorAttempt] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // ── Fetch quiz + this student's existing progress ────────
  useEffect(() => {
    let cancelled = false;

    const fetchQuiz = async () => {
      if (!courseId) {
        setFetchError("No course ID provided.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setFetchError(null);

      try {
        const quizRes = await withTimeout(api.get(`/quizzes/course/${courseId}`), FETCH_TIMEOUT_MS, "Loading quiz");
        if (cancelled) return;

        const quizData = quizRes.data?.data;
        if (!Array.isArray(quizData) || quizData.length === 0) {
          setFetchError("No quizzes found for this course.");
          return;
        }

        const q = quizData[0];
        const mappedQuiz = {
          _id: q._id,
          title: q.title || "Untitled Quiz",
          subject: q.subject || "General",
          totalTime: (q.totalTime || 10) * 60,
          questions: (q.questions || []).map((question, idx) => ({
            id: idx + 1,
            question: question.question,
            options: question.options || [],
            correct: question.correct ?? 0,
          })),
        };
        setQuiz(mappedQuiz);
        setTimeLeft(mappedQuiz.totalTime);

        try {
          const progRes = await withTimeout(api.get(`/progress/${courseId}`), FETCH_TIMEOUT_MS, "Loading progress");
          if (cancelled) return;
          const existing = (progRes.data?.progress?.quizzes || []).find((rec) => idOf(rec.quizId) === q._id);
          if (existing) {
            const percent = Math.round(existing.score);
            setPriorAttempt({
              score: percent,
              correctAnswers: existing.correctAnswers,
              totalQuestions: existing.totalQuestions,
              passed: percent >= PASS_THRESHOLD,
            });
          }
        } catch {
          // No progress yet is fine — just means a first attempt.
        }
      } catch (err) {
        if (!cancelled) setFetchError(err.message || "Failed to load quiz. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchQuiz();
    return () => {
      cancelled = true;
    };
  }, [courseId, retryTick]);

  const total = (quiz?.questions || []).length;
  const question = (quiz?.questions || [])[current];

  // ── Timer ────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== SCREEN.QUIZ) return;
    if (!question) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitQuiz(true); // time's up — force-submit regardless of gaps
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const handleSelect = (idx) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: idx }));
  };

  const handleToggleFlag = () => {
    if (!question) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  };

  const handleJump = (index) => {
    setCurrent(index);
    setShowReviewModal(false);
  };

  const handleNext = () => {
    if (current < total - 1) setCurrent((c) => c + 1);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  // ── Submit gate: block until every question is answered and unflagged ─
  const handleSubmitClick = () => {
    const unanswered = (quiz?.questions || []).filter((q) => answers[q.id] === undefined);
    const stillFlagged = (quiz?.questions || []).filter((q) => flagged.has(q.id));

    if (unanswered.length > 0 || stillFlagged.length > 0) {
      setShowReviewModal(true);
      return;
    }
    submitQuiz(false);
  };

  // ── Score locally, then report the attempt to the backend ─
  const submitQuiz = async (auto = false) => {
    clearInterval(timerRef.current);
    setShowReviewModal(false);
    setSubmitError(null);

    const correctCount = (quiz?.questions || []).reduce(
      (acc, q) => (answers[q.id] === q.correct ? acc + 1 : acc),
      0
    );
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = percent >= PASS_THRESHOLD;

    setAttemptResult({ score: percent, correctAnswers: correctCount, totalQuestions: total, passed });
    setScreen(SCREEN.RESULT);

    const orderedAnswers = (quiz?.questions || []).map((q) => answers[q.id] ?? -1);

    try {
      setSubmitting(true);
      await api.post(`/progress/${courseId}/quiz`, {
        quizId: quiz._id,
        score: percent,
        totalQuestions: total,
        correctAnswers: correctCount,
        answers: orderedAnswers,
      });
      setPriorAttempt({ score: percent, correctAnswers: correctCount, totalQuestions: total, passed });
    } catch (err) {
      console.error("Failed to submit quiz attempt:", err);
      setSubmitError("Your score was calculated, but we couldn't save it. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setScreen(SCREEN.INTRO);
    setCurrent(0);
    setAnswers({});
    setFlagged(new Set());
    setTimeLeft(quiz?.totalTime || 0);
    setAttemptResult(null);
    setSubmitError(null);
  };

  const handleRetryFetch = () => setRetryTick((t) => t + 1);

  const answered = Object.keys(answers).length;
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;
  const isLowTime = timeLeft <= 60;

  // ════════════════════════════════════════════════════════
  // LOADING / ERROR
  // ════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="qp-page">
        <div className="qp-state">
          <FiAward />
          <p>Loading quiz…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="qp-page">
        <div className="qp-state qp-state-error">
          <FiAlertCircle />
          <p>{fetchError}</p>
          <button className="qp-retry-btn" onClick={handleRetryFetch}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || total === 0) {
    return (
      <div className="qp-page">
        <div className="qp-state">
          <FiAward />
          <p>No quiz available for this course.</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // INTRO
  // ════════════════════════════════════════════════════════
  if (screen === SCREEN.INTRO) {
    return (
      <div className="qp-page">
        <QuizIntro
          quiz={quiz}
          total={total}
          passThreshold={PASS_THRESHOLD}
          priorAttempt={priorAttempt}
          onStart={() => setScreen(SCREEN.QUIZ)}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // RESULT
  // ════════════════════════════════════════════════════════
  if (screen === SCREEN.RESULT) {
    return (
      <div className="qp-page">
        <QuizResult
          quiz={quiz}
          answers={answers}
          attemptResult={attemptResult}
          passThreshold={PASS_THRESHOLD}
          submitting={submitting}
          submitError={submitError}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // QUIZ
  // ════════════════════════════════════════════════════════
  const unansweredIndexes = (quiz?.questions || [])
    .map((q, i) => (answers[q.id] === undefined ? i : -1))
    .filter((i) => i !== -1);
  const flaggedIndexes = (quiz?.questions || [])
    .map((q, i) => (flagged.has(q.id) ? i : -1))
    .filter((i) => i !== -1);

  return (
    <div className="qp-page">
      <div className="qp-quiz-card">
        <div className="qp-topbar">
          <div className="qp-topbar-left">
            <span className="qp-q-counter">
              Question <strong>{current + 1}</strong> / {total}
            </span>
            <span className="qp-answered-count">{answered} answered</span>
          </div>
          <div className={`qp-timer ${isLowTime ? "low" : ""}`}>
            <FiClock />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="qp-progress-track">
          <div className="qp-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <QuizQuestionCard
          question={question}
          selected={answers[question?.id] ?? null}
          onSelect={handleSelect}
          isFlagged={question ? flagged.has(question.id) : false}
          onToggleFlag={handleToggleFlag}
        />

        <QuizNavigatorBubbles
          questions={quiz.questions}
          current={current}
          answers={answers}
          flagged={flagged}
          onJump={handleJump}
        />

        <div className="qp-nav">
          <button className="qp-btn-nav" onClick={handlePrev} disabled={current === 0}>
            <FiChevronLeft /> Previous
          </button>

          <button className="qp-btn-nav primary" onClick={handleNext} disabled={current === total - 1}>
            Next <FiChevronRight />
          </button>
        </div>

        <button className="qp-btn-submit-persistent" onClick={handleSubmitClick}>
          Submit Quiz <FiAward />
        </button>
      </div>

      {showReviewModal && (
        <QuizReviewModal
          unansweredIndexes={unansweredIndexes}
          flaggedIndexes={flaggedIndexes}
          onJump={handleJump}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
}