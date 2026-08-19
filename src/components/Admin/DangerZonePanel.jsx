// src/components/admin/DangerZonePanel.jsx
import { useState, useEffect, useCallback } from "react";
import { FiUsers, FiPlayCircle, FiHelpCircle, FiMessageSquare, FiAlertTriangle, FiTrash2, FiRefreshCw } from "react-icons/fi";
import api from "../../services/api";

// Runs `deleteFn` over `ids` in fixed-size concurrent batches instead of
// firing every request at once. With counts that can run into the
// thousands (see /lectures total in prod data), an unbounded Promise.all
// over every id risks hammering the server / hanging the tab.
async function deleteInBatches(ids, deleteFn, batchSize = 20) {
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await Promise.all(batch.map(deleteFn));
  }
}

export default function DangerZonePanel() {
  const [counts, setCounts] = useState({ users: null, lectures: null, quizzes: null, complaints: null });
  const [countsLoading, setCountsLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const [selectedCourseId, setSelectedCourseId] = useState(""); // lectures-by-course
  const [courseLectureCount, setCourseLectureCount] = useState(null);

  const [selectedQuizCourseId, setSelectedQuizCourseId] = useState(""); // quizzes-by-course
  const [courseQuizCount, setCourseQuizCount] = useState(null);

  const [confirmTarget, setConfirmTarget] = useState(null); // { key, label, phrase, run }
  const [typedConfirm, setTypedConfirm] = useState("");
  const [working, setWorking] = useState(false);
  const [resultMsg, setResultMsg] = useState(null); // { type: "success"|"error", text }

  // Pulls just the pagination metadata (`total`) rather than every row.
  // `limit: 1` keeps the payload tiny even when the underlying collection
  // has thousands of records — we only ever read res.data.total.
  const fetchCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const [usersRes, lecturesRes, quizzesRes, coursesRes, complaintsRes] = await Promise.all([
        api.get("/admin/users", { params: { page: 1, limit: 1 } }),
        api.get("/lectures", { params: { page: 1, limit: 1 } }),
        api.get("/quizzes", { params: { page: 1, limit: 1 } }),
        api.get("/courses", { params: { page: 1, limit: 10000 } }),
        api.get("/admin/complaints", { params: { page: 1, limit: 1 } }),
      ]);

      setCounts({
        users: usersRes.data.totalUsers ?? (usersRes.data.users || []).length,
        lectures: lecturesRes.data.total ?? (lecturesRes.data.data || []).length,
        quizzes: quizzesRes.data.total ?? (quizzesRes.data.data || []).length,
        complaints: complaintsRes.data.totalComplaints ?? (complaintsRes.data.complaints || []).length,
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

  // Course-scoped lecture count: ask the API to filter+count directly
  // (?course=<id>&limit=1) instead of fetching every lecture and
  // filtering client-side. Adjust the `course` param name if your
  // /lectures route filters on something else.
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseLectureCount(null);
      return;
    }
    let cancelled = false;
    setCourseLectureCount(null);
    (async () => {
      try {
        const res = await api.get("/lectures", {
          params: { course: selectedCourseId, page: 1, limit: 10000 },
        });
        if (!cancelled) setCourseLectureCount(res.data.data.length ?? 0);
      } catch (err) {
        console.error("Failed to count lectures for course:", err);
        if (!cancelled) setCourseLectureCount(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCourseId]);

  // Same idea for quizzes (?courseId=<id>&limit=1). Adjust the param
  // name if your /quizzes route filters on something else.
  useEffect(() => {
    if (!selectedQuizCourseId) {
      setCourseQuizCount(null);
      return;
    }
    let cancelled = false;
    setCourseQuizCount(null);
    (async () => {
      try {
        const res = await api.get("/quizzes", {
          params: { courseId: selectedQuizCourseId, page: 1, limit: 10000 },
        });
        if (!cancelled) setCourseQuizCount(res.data.total ?? 0);
      } catch (err) {
        console.error("Failed to count quizzes for course:", err);
        if (!cancelled) setCourseQuizCount(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedQuizCourseId]);

  const closeConfirm = () => {
    setConfirmTarget(null);
    setTypedConfirm("");
  };

  // ---- the destructive actions ----

  const deleteAllUsers = async () => {
    await api.delete("/users/clear-all-users");
  };

  // No clear-all endpoint for lectures — fetch ids, delete in batchesf
  // rather than one unbounded Promise.all over the whole collection.
  const deleteAllLectures = async () => {
    const res = await api.get("/lectures", { params: { page: 1, limit: 10000 } });
    const all = res.data.data || [];
    await deleteInBatches(all, (l) => api.delete(`/lectures/${l._id}`));
  };

  // No clear-all endpoint for quizzes — same batched pattern.
  const deleteAllQuizzes = async () => {
    const res = await api.get("/quizzes", { params: { page: 1, limit: 10000 } });
    const all = res.data.data || [];
    await deleteInBatches(all, (q) => api.delete(`/quizzes/${q._id}`));
  };

  // Course-scoped lectures: fetch just this course's lectures (server-side
  // filter, not client-side .filter over everything), delete in batches.
  const deleteLecturesForCourse = async () => {
    const res = await api.get("/lectures", {
      params: { course: selectedCourseId, page: 1, limit: 10000 },
    });
    const matching = res.data.data || [];
    await deleteInBatches(matching, (l) => api.delete(`/lectures/${l._id}`));
  };

  // Course-scoped quizzes: real dedicated endpoint — one call, no fetch+loop.
  const deleteQuizzesForCourse = async () => {
    await api.delete(`/quizzes/course/${selectedQuizCourseId}`);
  };

  const deleteAllComplaints = async () => {
    await api.delete("/complaints/clear-all-complaints");
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
      if (confirmTarget.key === "course-quizzes") setSelectedQuizCourseId("");
    } catch (err) {
      console.error(`Failed: ${confirmTarget.label}`, err);
      setResultMsg({ type: "error", text: `Failed to complete "${confirmTarget.label}". Please try again.` });
    } finally {
      setWorking(false);
    }
  };

  const selectedCourse = courses.find((c) => c._id === selectedCourseId);
  const selectedQuizCourse = courses.find((c) => c._id === selectedQuizCourseId);

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
            <div className="admin-danger-card-icon"><FiMessageSquare /></div>
            <div>
              <h3>All Complaints</h3>
              <p>Every user complaint, including replies and status history.</p>
            </div>
          </div>
          <div className="admin-danger-card-footer">
            <span>{countsLoading ? "…" : `${counts.complaints ?? "?"} record(s)`}</span>
            <button
              className="admin-btn admin-btn-danger admin-btn-sm"
              disabled={countsLoading || counts.complaints === 0}
              onClick={() => setConfirmTarget({
                key: "complaints",
                label: "Delete all complaints",
                phrase: "DELETE ALL COMPLAINTS",
                run: deleteAllComplaints,
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

        <div className="admin-danger-card">
          <div className="admin-danger-card-top">
            <div className="admin-danger-card-icon"><FiHelpCircle /></div>
            <div>
              <h3>Quizzes for a Course</h3>
              <p>Delete only the quizzes that belong to one specific course.</p>
            </div>
          </div>
          <select
            className="admin-select"
            value={selectedQuizCourseId}
            onChange={(e) => setSelectedQuizCourseId(e.target.value)}
            style={{ margin: "10px 0" }}
          >
            <option value="">Select a course…</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <div className="admin-danger-card-footer">
            <span>
              {!selectedQuizCourseId ? "No course selected" : courseQuizCount === null ? "…" : `${courseQuizCount} record(s)`}
            </span>
            <button
              className="admin-btn admin-btn-danger admin-btn-sm"
              disabled={!selectedQuizCourseId || courseQuizCount === 0}
              onClick={() => setConfirmTarget({
                key: "course-quizzes",
                label: `Delete all quizzes in "${selectedQuizCourse?.title}"`,
                phrase: "DELETE QUIZZES",
                run: deleteQuizzesForCourse,
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