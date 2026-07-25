import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

// IMPORTANT: your real Quiz schema stores `correctAnswer` as a zero-based
// NUMBER INDEX into `options`, not the answer text. Every question here
// tracks `correctAnswerIndex` internally and the payload sends that index
// directly as `correctAnswer`.
const emptyQuestion = () => ({ question: "", options: ["", ""], correctAnswerIndex: null });

const SAMPLE_JSON = `[
  {
    "title": "JS Basics Quiz",
    "subject": "JavaScript",
    "totalTime": 15,
    "courseId": "64f...courseId",
    "questions": [
      {
        "question": "What keyword declares a constant?",
        "options": ["var", "let", "const", "static"],
        "correctAnswer": 2
      }
    ]
  }
]`;

const QuizFormModal = ({ mode, quiz, courses, onClose, onSuccess }) => {
  const isEdit = mode === "edit";

  const [entryMode, setEntryMode] = useState("single");
  const [title, setTitle] = useState(quiz?.title || "");
  const [subject, setSubject] = useState(quiz?.subject || "");
  const [totalTime, setTotalTime] = useState(quiz?.totalTime ?? "");
  const [courseId, setCourseId] = useState(quiz?.courseId?._id || quiz?.courseId || "");
  const [questions, setQuestions] = useState(
    quiz?.questions?.length
      ? quiz.questions.map((q) => ({
          question: q.question,
          options: q.options?.length ? [...q.options] : ["", ""],
          correctAnswerIndex: typeof q.correctAnswer === "number" ? q.correctAnswer : null,
        }))
      : [emptyQuestion()]
  );
  const [bulkJson, setBulkJson] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---- question helpers ----
  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const removeQuestion = (idx) => setQuestions((qs) => qs.filter((_, i) => i !== idx));

  const updateQuestionText = (idx, val) =>
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, question: val } : q)));

  const addOption = (qIdx) =>
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ""] } : q))
    );

  const removeOption = (qIdx, oIdx) =>
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOptions = q.options.filter((_, j) => j !== oIdx);
        let nextCorrect = q.correctAnswerIndex;
        if (nextCorrect === oIdx) nextCorrect = null;
        else if (nextCorrect !== null && nextCorrect > oIdx) nextCorrect -= 1;
        return { ...q, options: nextOptions, correctAnswerIndex: nextCorrect };
      })
    );

  const updateOption = (qIdx, oIdx, val) =>
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOptions = q.options.map((o, j) => (j === oIdx ? val : o));
        return { ...q, options: nextOptions };
      })
    );

  const setCorrectAnswer = (qIdx, oIdx) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIdx ? { ...q, correctAnswerIndex: oIdx } : q)));

  // ---- validation (single-entry mode) ----
  const validateSingle = () => {
    if (!title.trim()) return "Title is required.";
    if (!subject.trim()) return "Subject is required.";
    if (totalTime === "" || Number(totalTime) <= 0) return "Valid total time is required.";
    if (!courseId) return "Course is required.";
    if (questions.length === 0) return "At least one question is required.";

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return `Question ${i + 1}: question text is required.`;
      const nonEmptyCount = q.options.filter((o) => o.trim()).length;
      if (nonEmptyCount < 2) return `Question ${i + 1}: at least 2 options are required.`;
      if (
        q.correctAnswerIndex === null ||
        q.correctAnswerIndex === undefined ||
        !q.options[q.correctAnswerIndex]?.trim()
      ) {
        return `Question ${i + 1}: select a correct answer from its options.`;
      }
    }
    return "";
  };

  const buildSinglePayload = () => ({
    title,
    subject,
    totalTime: Number(totalTime),
    courseId,
    questions: questions.map((q) => ({
      question: q.question,
      options: q.options.filter((o) => o.trim()),
      correctAnswer: q.correctAnswerIndex,
    })),
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (isEdit) {
        const validationError = validateSingle();
        if (validationError) {
          setError(validationError);
          setSubmitting(false);
          return;
        }
        setError("");
        await api.put(`/quizzes/${quiz._id}`, buildSinglePayload());
        showToast("Quiz updated successfully", "success");
        onSuccess();
        return;
      }

      if (entryMode === "bulk") {
        if (!bulkJson.trim()) {
          setError("Paste a JSON array first.");
          setSubmitting(false);
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(bulkJson);
        } catch {
          setError("Invalid JSON — check for missing commas, quotes, or brackets.");
          setSubmitting(false);
          return;
        }
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setError("JSON must be a non-empty array of quiz objects.");
          setSubmitting(false);
          return;
        }
        setError("");
        const res = await api.post("/quizzes", parsed);
        showToast(res.data.message || `${parsed.length} quiz(zes) created successfully`, "success");
        onSuccess();
        return;
      }

      const validationError = validateSingle();
      if (validationError) {
        setError(validationError);
        setSubmitting(false);
        return;
      }
      setError("");
      const res = await api.post("/quizzes", buildSinglePayload());
      showToast(res.data.message || "Quiz created successfully", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Quiz" : "Add Quiz"}
      onClose={onClose}
      width={680}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Quiz"}
          </button>
        </>
      }
    >
      {!isEdit && (
        <div className="entry-mode-tabs">
          <button
            type="button"
            className={`entry-mode-tab ${entryMode === "single" ? "active" : ""}`}
            onClick={() => setEntryMode("single")}
          >
            Single Quiz
          </button>
          <button
            type="button"
            className={`entry-mode-tab ${entryMode === "bulk" ? "active" : ""}`}
            onClick={() => setEntryMode("bulk")}
          >
            Bulk (Paste JSON)
          </button>
        </div>
      )}

      {(isEdit || entryMode === "single") && (
        <>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">
                Title<span className="required">*</span>
              </label>
              <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">
                Subject<span className="required">*</span>
              </label>
              <input className="field-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">
                Total Time (minutes)<span className="required">*</span>
              </label>
              <input
                className="field-input"
                type="number"
                min="1"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
              />
            </div>
            <div className="field-group">
              <label className="field-label">
                Course<span className="required">*</span>
              </label>
              <select className="field-select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">Select a course…</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="quiz-questions-header">
            <span className="field-label">Questions</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion}>
              <FiPlus /> Add Question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div className="quiz-question-card" key={qIdx}>
              <div className="quiz-question-card-header">
                <span className="quiz-question-number">Question {qIdx + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="btn-icon danger btn-sm-icon"
                    onClick={() => removeQuestion(qIdx)}
                    title="Remove question"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              <div className="field-group">
                <input
                  className="field-input"
                  placeholder="Question text"
                  value={q.question}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                />
              </div>

              <div className="quiz-options-list">
                {q.options.map((opt, oIdx) => (
                  <div className="quiz-option-row" key={oIdx}>
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctAnswerIndex === oIdx}
                      onChange={() => setCorrectAnswer(qIdx, oIdx)}
                      disabled={!opt.trim()}
                      title="Mark as correct answer"
                    />
                    <input
                      className="field-input"
                      placeholder={`Option ${oIdx + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        className="btn-icon danger btn-sm-icon"
                        onClick={() => removeOption(qIdx, oIdx)}
                        title="Remove option"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => addOption(qIdx)}>
                  <FiPlus /> Add Option
                </button>
              </div>
              <span className="field-hint">
                Select the radio button next to the correct option — stored as its index (0, 1, 2…), matching your schema.
              </span>
            </div>
          ))}
        </>
      )}

      {!isEdit && entryMode === "bulk" && (
        <div className="field-group">
          <label className="field-label">Paste a JSON array of quizzes</label>
          <textarea
            className="field-textarea bulk-textarea"
            placeholder={SAMPLE_JSON}
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            spellCheck={false}
          />
          <span className="field-hint">
            Remember: <strong>correctAnswer</strong> must be the numeric index into that question's <strong>options</strong> array, not the answer text.
          </span>
        </div>
      )}

      {error && <span className="field-error">{error}</span>}
    </Modal>
  );
};

export default QuizFormModal;
