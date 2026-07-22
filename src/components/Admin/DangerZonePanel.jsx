// src/components/admin/DangerZonePanel.jsx
import { useState, useEffect, useCallback } from "react";
import { FiUsers, FiPlayCircle, FiHelpCircle, FiAlertTriangle, FiTrash2, FiRefreshCw } from "react-icons/fi";
import api from "../../services/api";

export default function DangerZonePanel() {
  const [counts, setCounts] = useState({ users: null, lectures: null, quizzes: null });
  const [countsLoading, setCountsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseLectureCount, setCourseLectureCount] = useState(null);

  const [confirmTarget, setConfirmTarget] = useState(null); // { key, label, phrase, run }
  const [typedConfirm, setTypedConfirm] = useState("");
  const [working, setWorking] = useState(false);
  const [resultMsg, setResultMsg] = useState(null); // { type: "success"|"error", text }

  const fetchCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const [usersRes, lecturesRes, quizzesRes, coursesRes] = await Promise.all([
        api.get("/users/all-users"),
        api.get("/lectures"),
        api.get("/quizzes"),
        api.get("/courses"),
      ]);
      setCounts({
        users: (usersRes.data.users || []).length,
        lectures: (lecturesRes.data.data || []).length,
        quizzes: (quizzesRes.data.data || []).length,
      });
      setCourses(coursesRes.data.data || []);
    } catch (err) {
      console.error("Failed to load counts for danger zone:", err);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Whenever a course is picked, work out how many of its lectures currently
  // exist so the confirmation dialog can show a real number, not a guess.
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseLectureCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/lectures");
        const all = res.data.data || [];
        const count = all.filter((l) => (l.course?._id || l.course) === selectedCourseId).length;
        if (!cancelled) setCourseLectureCount(count);
      } catch (err) {
        console.error("Failed to count lectures for course:", err);
        if (!cancelled) setCourseLectureCount(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCourseId]);

  const closeConfirm = () => {
    setConfirmTarget(null);
    setTypedConfirm("");
  };

  // ---- the four destructive actions ----

  const deleteAllUsers = async () => {
    await api.delete("/users/clear-all-users");
  };

  // No clear-all endpoint for lectures — fetch every lecture, delete one by one.
  const deleteAllLectures = async () => {
    const res = await api.get("/lectures");
    const all = res.data.data || [];
    await Promise.all(all.map((l) => api.delete(`/lectures/${l._id}`)));
  };

  // No clear-all endpoint for quizzes — same pattern.
  const deleteAllQuizzes = async () => {
    const res = await api.get("/quizzes");
    const all = res.data.data || [];
    await Promise.all(all.map((q) => api.delete(`/quizzes/${q._id}`)));
  };

  // Course-scoped: fetch every lecture, filter to this course client-side,
  // delete only those.
  const deleteLecturesForCourse = async () => {
    const res = await api.get("/lectures");
    const all = res.data.data || [];
    const matching = all.filter((l) => (l.course?._id || l.course) === selectedCourseId);
    await Promise.all(matching.map((l) => api.delete(`/lectures/${l._id}`)));
  };

  const runAction = async () => {
    if (!confirmTarget) return;
    setWorking(true);
    setResultMsg(null);
    try {
      await confirmTarget.run();
      setResultMsg({ type: "success", text: `${confirmTarget.label} — done.` });
      closeConfirm();
      fetchCounts();
      if (confirmTarget.key === "course-lectures") setSelectedCourseId("");
    } catch (err) {
      console.error(`Failed: ${confirmTarget.label}`, err);
      setResultMsg({ type: "error", text: `Failed to complete "${confirmTarget.label}". Please try again.` });
    } finally {
      setWorking(false);
    }
  };

  const selectedCourse = courses.find((c) => c._id === selectedCourseId);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Danger Zone — Bulk Delete</h2>
        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={fetchCounts} disabled={countsLoading}>
          <FiRefreshCw className={countsLoading ? "cp-spin" : ""} /> Refresh counts
        </button>
      </div>

      <div className="admin-danger-banner">
        <FiAlertTriangle />
        <span>Every action below permanently deletes data with no recovery option. Double-check before proceeding.</span>
      </div>

      {resultMsg && (
        <p className={resultMsg.type === "error" ? "admin-form-error" : "admin-form-success"}>
          {resultMsg.text}
        </p>
      )}

      <div className="admin-danger-grid">
        <div className="admin-danger-card">
          <div className="admin-danger-card-top">
            <div className="admin-danger-card-icon"><FiUsers /></div>
            <div>
              <h3>All Users</h3>
              <p>Every registered user account on the platform.</p>
            </div>
          </div>
          <div className="admin-danger-card-footer">
            <span>{countsLoading ? "…" : `${counts.users ?? "?"} record(s)`}</span>
            <button
              className="admin-btn admin-btn-danger admin-btn-sm"
              disabled={countsLoading || counts.users === 0}
              onClick={() => setConfirmTarget({
                key: "users",
                label: "Delete all users",
                phrase: "DELETE ALL USERS",
                run: deleteAllUsers,
              })}
            >
              <FiTrash2 /> Delete All
            </button>
          </div>
        </div>

        <div className="admin-danger-card">
          <div className="admin-danger-card-top">
            <div className="admin-danger-card-icon"><FiPlayCircle /></div>
            <div>
              <h3>All Lectures</h3>
              <p>Every lecture across every course.</p>
            </div>
          </div>
          <div className="admin-danger-card-footer">
            <span>{countsLoading ? "…" : `${counts.lectures ?? "?"} record(s)`}</span>
            <button
              className="admin-btn admin-btn-danger admin-btn-sm"
              disabled={countsLoading || counts.lectures === 0}
              onClick={() => setConfirmTarget({
                key: "lectures",
                label: "Delete all lectures",
                phrase: "DELETE ALL LECTURES",
                run: deleteAllLectures,
              })}
            >
              <FiTrash2 /> Delete All
            </button>
          </div>
        </div>

        <div className="admin-danger-card">
          <div className="admin-danger-card-top">
            <div className="admin-danger-card-icon"><FiHelpCircle /></div>
            <div>
              <h3>All Quizzes</h3>
              <p>Every quiz and all of its questions.</p>
            </div>
          </div>
          <div className="admin-danger-card-footer">
            <span>{countsLoading ? "…" : `${counts.quizzes ?? "?"} record(s)`}</span>
            <button
              className="admin-btn admin-btn-danger admin-btn-sm"
              disabled={countsLoading || counts.quizzes === 0}
              onClick={() => setConfirmTarget({
                key: "quizzes",
                label: "Delete all quizzes",
                phrase: "DELETE ALL QUIZZES",
                run: deleteAllQuizzes,
              })}
            >
              <FiTrash2 /> Delete All
            </button>
          </div>
        </div>

        <div className="admin-danger-card">
          <div className="admin-danger-card-top">
            <div className="admin-danger-card-icon"><FiPlayCircle /></div>
            <div>
              <h3>Lectures for a Course</h3>
              <p>Delete only the lectures that belong to one specific course.</p>
            </div>
          </div>
          <select
            className="admin-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{ margin: "10px 0" }}
          >
            <option value="">Select a course…</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <div className="admin-danger-card-footer">
            <span>
              {!selectedCourseId ? "No course selected" : courseLectureCount === null ? "…" : `${courseLectureCount} record(s)`}
            </span>
            <button
              className="admin-btn admin-btn-danger admin-btn-sm"
              disabled={!selectedCourseId || courseLectureCount === 0}
              onClick={() => setConfirmTarget({
                key: "course-lectures",
                label: `Delete all lectures in "${selectedCourse?.title}"`,
                phrase: "DELETE LECTURES",
                run: deleteLecturesForCourse,
              })}
            >
              <FiTrash2 /> Delete for Course
            </button>
          </div>
        </div>
      </div>

      {confirmTarget && (
        <div className="admin-modal-overlay" onMouseDown={closeConfirm}>
          <div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{confirmTarget.label}?</h3>
            </div>
            <div className="admin-modal-body">
              <p className="admin-danger-confirm-text">
                This action is permanent and cannot be undone. Type{" "}
                <strong>{confirmTarget.phrase}</strong> below to confirm.
              </p>
              <input
                className="admin-danger-confirm-input"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder={confirmTarget.phrase}
                autoFocus
              />
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={closeConfirm} disabled={working}>
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger"
                disabled={typedConfirm.trim() !== confirmTarget.phrase || working}
                onClick={runAction}
              >
                {working ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
