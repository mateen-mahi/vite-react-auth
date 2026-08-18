// src/components/admin/QuizTable.jsx
import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import api from "../../services/api";
import Pagination from "./Pagination";
import EditModal from "./EditModal";

const PAGE_SIZE = 8;

const emptyQuestion = () => ({ question: "", options: ["", ""], correctAnswer: "" });
const emptyForm = { title: "", subject: "", totalTime: "", courseId: "", questions: [emptyQuestion()] };

export default function QuizTable() {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [busyId, setBusyId] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [quizRes, courseRes] = await Promise.all([
          api.get("/quizzes"),
          api.get("/courses"),
        ]);
        setQuizzes(quizRes.data.data || []);
        setCourses(courseRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch quizzes:", err);
        setError("Couldn't load quizzes.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = quizzes;
    if (search) list = list.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()));
    if (courseFilter !== "All") list = list.filter((q) => (q.courseId?._id || q.courseId) === courseFilter);
    return list;
  }, [quizzes, search, courseFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const courseTitleFor = (q) => q.courseId?.title || courses.find((c) => c._id === (q.courseId?._id || q.courseId))?.title || "—";

  const deleteQuiz = async (id, title) => {
    if (!window.confirm(`Delete quiz "${title}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      alert("Failed to delete quiz. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (q) => {
    setEditingQuiz(q);
    setFormError("");
    setForm({
      title: q.title || "",
      subject: q.subject || "",
      totalTime: q.totalTime ?? "",
      courseId: q.courseId?._id || q.courseId || "",
      questions: q.questions?.length
        ? q.questions.map((qq) => ({
            question: qq.question,
            options: qq.options?.length ? [...qq.options] : ["", ""],
            correctAnswer: qq.correctAnswer,
          }))
        : [emptyQuestion()],
    });
  };

  const closeEdit = () => {
    setEditingQuiz(null);
    setForm(emptyForm);
    setFormError("");
  };

  // ---- dynamic question helpers ----
  const addQuestion = () => setForm((f) => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
  const removeQuestion = (idx) =>
    setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  const updateQuestion = (idx, key, val) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === idx ? { ...q, [key]: val } : q)),
    }));
  const addOption = (qIdx) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ""] } : q)),
    }));
  const removeOption = (qIdx, oIdx) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => {
        if (i !== qIdx) return q;
        const removedVal = q.options[oIdx];
        return {
          ...q,
          options: q.options.filter((_, j) => j !== oIdx),
          correctAnswer: q.correctAnswer === removedVal ? "" : q.correctAnswer,
        };
      }),
    }));
  const updateOption = (qIdx, oIdx, val) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOptions = q.options.map((o, j) => (j === oIdx ? val : o));
        return {
          ...q,
          options: nextOptions,
          correctAnswer: q.correctAnswer === q.options[oIdx] ? val : q.correctAnswer,
        };
      }),
    }));

  const validate = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.subject.trim()) return "Subject is required.";
    if (form.totalTime === "" || Number(form.totalTime) <= 0) return "Valid total time is required.";
    if (!form.courseId) return "Course is required.";
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question.trim()) return `Question ${i + 1}: question text is required.`;
      const nonEmpty = q.options.filter((o) => o.trim());
      if (nonEmpty.length < 2) return `Question ${i + 1}: at least 2 options are required.`;
      if (!q.correctAnswer || !nonEmpty.includes(q.correctAnswer)) {
        return `Question ${i + 1}: select a correct answer from its options.`;
      }
    }
    return "";
  };

  const saveEdit = async () => {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setSaving(true);
    const payload = {
      title: form.title,
      subject: form.subject,
      totalTime: Number(form.totalTime),
      courseId: form.courseId,
      questions: form.questions.map((q) => ({
        question: q.question,
        options: q.options.filter((o) => o.trim()),
        correctAnswer: q.correctAnswer,
      })),
    };
    try {
      const res = await api.put(`/quizzes/${editingQuiz._id}`, payload);
      const updated = res.data?.data || { ...editingQuiz, ...payload };
      setQuizzes((prev) => prev.map((q) => (q._id === editingQuiz._id ? { ...q, ...updated } : q)));
      closeEdit();
    } catch (e) {
      console.error("Failed to update quiz:", e);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Quiz Management</h2>
        <span className="admin-panel-count">{filtered.length} quizzes</span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FiSearch className="admin-search-icon" />
          <input className="admin-search" placeholder="Search quizzes…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="admin-select" value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}>
          <option value="All">All Courses</option>
          {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>

      {loading && <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading quizzes…</p>}
      {!loading && error && <p className="admin-panel-count"><FiAlertCircle /> {error}</p>}

      {!loading && !error && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Quiz</th><th>Course</th><th>Questions</th><th>Total Time</th><th></th></tr>
              </thead>
              <tbody>
                {pageItems.map((q) => (
                  <tr key={q._id}>
                    <td className="admin-cell-primary">{q.title}</td>
                    <td className="admin-cell-secondary">{courseTitleFor(q)}</td>
                    <td className="admin-cell-secondary">{q.questions?.length ?? q.questionCount ?? "—"}</td>
                    <td className="admin-cell-secondary">{q.totalTime}m</td>
                    <td>
                      <div className="admin-row-actions">
                        <button title="Edit" onClick={() => openEdit(q)}><FiEdit2 /></button>
                        <button
                          title="Delete"
                          className="admin-row-action-danger"
                          disabled={busyId === q._id}
                          onClick={() => deleteQuiz(q._id, q.title)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Avg score / pass rate / attempt count columns still not shown — those need a
          QuizAttempt model + submit-endpoint that doesn't exist yet. */}

      {editingQuiz && (
        <EditModal title={`Edit Quiz — ${editingQuiz.title}`} onClose={closeEdit} onSave={saveEdit} saving={saving} wide>
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Subject</label>
              <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
          </div>
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Total Time (minutes)</label>
              <input type="number" min="1" value={form.totalTime} onChange={(e) => setForm((f) => ({ ...f, totalTime: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Course</label>
              <select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}>
                <option value="">Select a course…</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          <div className="admin-questions-header">
            <label>Questions</label>
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={addQuestion}>
              <FiPlus /> Add Question
            </button>
          </div>

          {form.questions.map((q, qIdx) => (
            <div className="admin-question-card" key={qIdx}>
              <div className="admin-question-card-header">
                <span>Question {qIdx + 1}</span>
                {form.questions.length > 1 && (
                  <button
                    type="button"
                    className="admin-row-action-danger admin-icon-btn-sm"
                    onClick={() => removeQuestion(qIdx)}
                    title="Remove question"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              <input
                placeholder="Question text"
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
              />

              <div className="admin-options-list">
                {q.options.map((opt, oIdx) => (
                  <div className="admin-option-row" key={oIdx}>
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctAnswer === opt && opt.trim() !== ""}
                      onChange={() => updateQuestion(qIdx, "correctAnswer", opt)}
                      disabled={!opt.trim()}
                      title="Mark as correct answer"
                    />
                    <input
                      placeholder={`Option ${oIdx + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        className="admin-row-action-danger admin-icon-btn-sm"
                        onClick={() => removeOption(qIdx, oIdx)}
                        title="Remove option"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => addOption(qIdx)}>
                  <FiPlus /> Add Option
                </button>
              </div>
            </div>
          ))}

          {formError && <p className="admin-form-error">{formError}</p>}
        </EditModal>
      )}
    </div>
  );
}
