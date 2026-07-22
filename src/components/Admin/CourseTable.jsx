// src/components/admin/CourseTable.jsx
import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiStar, FiTrash2, FiEdit2, FiAlertTriangle, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import api from "../../services/api";
import { useAdminSocket } from "../../custom-hooks/useAdminSocket";
import Pagination from "./Pagination";
import EditModal from "./EditModal";

const PAGE_SIZE = 8;

const isDataFlagged = (c) => {
  const lessons = c.lessonsCount ?? c.lecturesCount ?? 0;
  return lessons < 10 || lessons > 15;
};

const emptyForm = {
  title: "", description: "", category: "", price: "", duration: "",
  level: "Beginner", color: "#2563eb", emoji: "📘",
};

export default function CourseTable() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All Levels");
  const [page, setPage] = useState(1);
  const { subscribe } = useAdminSocket();

  const [busyId, setBusyId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null); // full course object being edited
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/courses");
        setCourses(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError("Couldn't load courses.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const cleanups = [
      subscribe("course:created", (newCourse) => {
        setCourses((prev) => (prev.some((c) => c._id === newCourse._id) ? prev : [newCourse, ...prev]));
      }),
      subscribe("course:updated", (updatedCourse) => {
        setCourses((prev) => prev.map((c) => (c._id === updatedCourse._id ? { ...c, ...updatedCourse } : c)));
      }),
      subscribe("enrollment:new", ({ courseId }) => {
        setCourses((prev) =>
          prev.map((c) =>
            c._id === courseId
              ? { ...c, studentsEnrolledCount: (c.studentsEnrolledCount || 0) + 1 }
              : c
          )
        );
      }),
    ];
    return () => cleanups.forEach((c) => c());
  }, [subscribe]);

  const categories = useMemo(() => ["All", ...new Set(courses.map((c) => c.category))], [courses]);

  const filtered = useMemo(() => {
    let list = courses;
    if (search) list = list.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== "All") list = list.filter((c) => c.category === category);
    if (level !== "All Levels") list = list.filter((c) => c.level === level);
    return list;
  }, [courses, search, category, level]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleFeatured = async (id, current) => {
    setCourses((prev) => prev.map((c) => (c._id === id ? { ...c, featured: !current } : c))); // optimistic
    try {
      await api.put(`/courses/${id}`, { featured: !current });
    } catch (err) {
      console.error("Failed to toggle featured:", err);
      setCourses((prev) => prev.map((c) => (c._id === id ? { ...c, featured: current } : c))); // revert
    }
  };

  const deleteCourse = async (id, title) => {
    if (!window.confirm(`Delete course "${title}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await api.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Failed to delete course:", err);
      alert("Failed to delete course. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (c) => {
    setEditingCourse(c);
    setForm({
      title: c.title || "",
      description: c.description || "",
      category: c.category || "",
      price: c.price ?? "",
      duration: c.duration || "",
      level: c.level || "Beginner",
      color: c.color || "#2563eb",
      emoji: c.emoji || "📘",
    });
  };

  const closeEdit = () => {
    setEditingCourse(null);
    setForm(emptyForm);
  };

  const saveEdit = async () => {
    if (!editingCourse) return;
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      duration: form.duration,
      level: form.level,
      color: form.color,
      emoji: form.emoji,
    };
    try {
      const res = await api.put(`/courses/${editingCourse._id}`, payload);
      const updated = res.data?.data || { ...editingCourse, ...payload };
      setCourses((prev) => prev.map((c) => (c._id === editingCourse._id ? { ...c, ...updated } : c)));
      closeEdit();
    } catch (err) {
      console.error("Failed to update course:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Course Management</h2>
        <span className="admin-panel-count">{filtered.length} courses</span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FiSearch className="admin-search-icon" />
          <input className="admin-search" placeholder="Search courses…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="admin-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="admin-select" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
          {["All Levels", "Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      {loading && <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading courses…</p>}
      {!loading && error && <p className="admin-panel-count"><FiAlertCircle /> {error}</p>}

      {!loading && !error && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Course</th><th>Category / Level</th><th>Students</th><th>Revenue</th><th>Data Quality</th><th>Featured</th><th></th></tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-avatar-sm" style={{ background: c.color }}>{c.emoji}</div>
                        <div>
                          <p className="admin-cell-primary">{c.title}</p>
                          <p className="admin-cell-secondary">by {c.instructor?.username || c.instructor}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="admin-cell-primary">{c.category}</p>
                      <p className="admin-cell-secondary">{c.level}</p>
                    </td>
                    <td className="admin-cell-primary">{(c.studentsEnrolledCount || 0).toLocaleString()}</td>
                    <td className="admin-cell-primary">
                      ${((c.price || 0) * (c.studentsEnrolledCount || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td>
                      {isDataFlagged(c)
                        ? <span className="admin-flag-badge"><FiAlertTriangle /> Review</span>
                        : <span className="admin-status-badge verified">OK</span>}
                    </td>
                    <td>
                      <button
                        className={`admin-toggle ${c.featured ? "on" : ""}`}
                        onClick={() => toggleFeatured(c._id, c.featured)}
                        title="Toggle featured"
                      >
                        <FiStar />
                      </button>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button title="Edit" onClick={() => openEdit(c)}><FiEdit2 /></button>
                        <button
                          title="Delete"
                          className="admin-row-action-danger"
                          disabled={busyId === c._id}
                          onClick={() => deleteCourse(c._id, c.title)}
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

      {editingCourse && (
        <EditModal title={`Edit Course — ${editingCourse.title}`} onClose={closeEdit} onSave={saveEdit} saving={saving}>
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
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Price ($)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
          </div>
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Duration</label>
              <input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Level</label>
              <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Color</label>
              <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Emoji</label>
              <input value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} />
            </div>
          </div>
        </EditModal>
      )}
    </div>
  );
}
