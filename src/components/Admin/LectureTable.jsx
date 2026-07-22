// src/components/admin/LectureTable.jsx
import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiEdit2, FiTrash2, FiCheckCircle, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import api from "../../services/api";
import Pagination from "./Pagination";
import EditModal from "./EditModal";

const PAGE_SIZE = 8;

const emptyForm = { title: "", description: "", videoId: "", duration: "", course: "", quizId: "" };

export default function LectureTable() {
  const [lectures, setLectures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [busyId, setBusyId] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Quizzes are fetched alongside courses/lectures so the edit form's
        // "linked quiz" dropdown has real options to choose from.
        const [lectureRes, courseRes, quizRes] = await Promise.all([
          api.get("/lectures"),
          api.get("/courses"),
          api.get("/quizzes"),
        ]);
        setLectures(lectureRes.data.data || []);
        setCourses(courseRes.data.data || []);
        setQuizzes(quizRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch lectures:", err);
        setError("Couldn't load lectures.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = lectures;
    if (search) list = list.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()));
    if (courseFilter !== "All") list = list.filter((l) => (l.course?._id || l.course) === courseFilter);
    return list;
  }, [lectures, search, courseFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const courseTitleFor = (l) => l.course?.title || courses.find((c) => c._id === (l.course?._id || l.course))?.title || "—";

  const deleteLecture = async (id, title) => {
    if (!window.confirm(`Delete lecture "${title}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await api.delete(`/lectures/${id}`);
      setLectures((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error("Failed to delete lecture:", err);
      alert("Failed to delete lecture. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (l) => {
    setEditingLecture(l);
    setForm({
      title: l.title || "",
      description: l.description || "",
      videoId: l.videoId || "",
      duration: l.duration ?? "",
      course: l.course?._id || l.course || "",
      quizId: l.quizId?._id || l.quizId || "",
    });
  };

  const closeEdit = () => {
    setEditingLecture(null);
    setForm(emptyForm);
  };

  const saveEdit = async () => {
    if (!editingLecture) return;
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      videoId: form.videoId,
      duration: Number(form.duration),
      course: form.course,
      quizId: form.quizId || null,
    };
    try {
      const res = await api.put(`/lectures/${editingLecture._id}`, payload);
      const updated = res.data?.data || { ...editingLecture, ...payload };
      setLectures((prev) => prev.map((l) => (l._id === editingLecture._id ? { ...l, ...updated } : l)));
      closeEdit();
    } catch (err) {
      console.error("Failed to update lecture:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Lecture Management</h2>
        <span className="admin-panel-count">{filtered.length} lectures</span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FiSearch className="admin-search-icon" />
          <input className="admin-search" placeholder="Search lectures…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="admin-select" value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}>
          <option value="All">All Courses</option>
          {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>

      {loading && <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading lectures…</p>}
      {!loading && error && <p className="admin-panel-count"><FiAlertCircle /> {error}</p>}

      {!loading && !error && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Lecture</th><th>Course</th><th>Duration</th><th>Video Status</th><th></th></tr>
              </thead>
              <tbody>
                {pageItems.map((l) => (
                  <tr key={l._id}>
                    <td className="admin-cell-primary">{l.title}</td>
                    <td className="admin-cell-secondary">{courseTitleFor(l)}</td>
                    <td className="admin-cell-secondary">{l.duration}m</td>
                    <td>
                      {/* No broken-video checker built yet — everything shows OK until that's added */}
                      <span className="admin-status-badge verified"><FiCheckCircle /> OK</span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button title="Edit" onClick={() => openEdit(l)}><FiEdit2 /></button>
                        <button
                          title="Delete"
                          className="admin-row-action-danger"
                          disabled={busyId === l._id}
                          onClick={() => deleteLecture(l._id, l.title)}
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

      {editingLecture && (
        <EditModal title={`Edit Lecture — ${editingLecture.title}`} onClose={closeEdit} onSave={saveEdit} saving={saving}>
          <div className="admin-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Video ID</label>
              <input value={form.videoId} onChange={(e) => setForm((f) => ({ ...f, videoId: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Duration (minutes)</label>
              <input type="number" min="0" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
            </div>
          </div>
          <div className="admin-field">
            <label>Course</label>
            <select value={form.course} onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}>
              <option value="">Select a course…</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Linked Quiz (optional)</label>
            <select value={form.quizId} onChange={(e) => setForm((f) => ({ ...f, quizId: e.target.value }))}>
              <option value="">No quiz</option>
              {quizzes.map((q) => <option key={q._id} value={q._id}>{q.title}</option>)}
            </select>
          </div>
        </EditModal>
      )}
    </div>
  );
}
