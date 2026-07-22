import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

const emptyQuestion = () => ({
  question: "",
  options: ["", ""],
  correctAnswer: "",
});

const QuizFormModal = ({ mode, quiz, courses, onClose, onSuccess }) => {
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(quiz?.title || "");
  const [subject, setSubject] = useState(quiz?.subject || "");
  const [totalTime, setTotalTime] = useState(quiz?.totalTime ?? "");
  const [courseId, setCourseId] = useState(quiz?.courseId?._id || quiz?.courseId || "");
  const [questions, setQuestions] = useState(
    quiz?.questions?.length
      ? quiz.questions.map((q) => ({
          question: q.question,
          options: q.options?.length ? [...q.options] : ["", ""],
          correctAnswer: q.correctAnswer,
        }))
      : [emptyQuestion()]
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---- question helpers ----
  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const removeQuestion = (idx) =>
    setQuestions((qs) => qs.filter((_, i) => i !== idx));

  const updateQuestion = (idx, key, val) =>
    setQuestions((qs) =>
      qs.map((q, i) => (i === idx ? { ...q, [key]: val } : q))
    );

  const addOption = (qIdx) =>
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ""] } : q))
    );

  const removeOption = (qIdx, oIdx) =>
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOptions = q.options.filter((_, j) => j !== oIdx);
        const removedVal = q.options[oIdx];
        return {
          ...q,
          options: nextOptions,
          correctAnswer: q.correctAnswer === removedVal ? "" : q.correctAnswer,
        };
      })
    );

  const updateOption = (qIdx, oIdx, val) =>
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOptions = q.options.map((o, j) => (j === oIdx ? val : o));
        return {
          ...q,
          options: nextOptions,
          // keep correctAnswer in sync if it pointed at the edited option
          correctAnswer: q.correctAnswer === q.options[oIdx] ? val : q.correctAnswer,
        };
      })
    );

  // ---- validation ----
  const validate = () => {
    if (!title.trim()) return "Title is required.";
    if (!subject.trim()) return "Subject is required.";
    if (totalTime === "" || Number(totalTime) <= 0) return "Valid total time is required.";
    if (!courseId) return "Course is required.";
    if (questions.length === 0) return "At least one question is required.";

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return `Question ${i + 1}: question text is required.`;
      const nonEmptyOptions = q.options.filter((o) => o.trim());
      if (nonEmptyOptions.length < 2) return `Question ${i + 1}: at least 2 options are required.`;
      if (!q.correctAnswer || !nonEmptyOptions.includes(q.correctAnswer)) {
        return `Question ${i + 1}: select a correct answer from its options.`;
      }
    }
    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        title,
        subject,
        totalTime: Number(totalTime),
        courseId,
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options.filter((o) => o.trim()),
          correctAnswer: q.correctAnswer,
        })),
      };

      if (isEdit) {
        await api.put(`/quizzes/${quiz._id}`, payload);
        showToast("Quiz updated successfully", "success");
      } else {
        await api.post("/quizzes/", payload);
        showToast("Quiz created successfully", "success");
      }
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Quiz" : "Add New Quiz"}
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
              onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
            />
          </div>

          <div className="quiz-options-list">
            {q.options.map((opt, oIdx) => (
              <div className="quiz-option-row" key={oIdx}>
                <input
                  type="radio"
                  name={`correct-${qIdx}`}
                  checked={q.correctAnswer === opt && opt.trim() !== ""}
                  onChange={() => updateQuestion(qIdx, "correctAnswer", opt)}
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
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => addOption(qIdx)}
            >
              <FiPlus /> Add Option
            </button>
          </div>
          <span className="field-hint">Select the radio button next to the correct option.</span>
        </div>
      ))}

      {error && <span className="field-error">{error}</span>}
    </Modal>
  );
};

export default QuizFormModal;
