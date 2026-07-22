import { useEffect, useMemo, useState, useCallback } from "react";
import { FiPlus, FiUpload, FiTrash2, FiEdit2, FiHelpCircle } from "react-icons/fi";
import api from "../../../services/api";
import DataTable from "../../../components/admin-shared/DataTable/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar/SearchBar";
import Pagination from "../../../components/admin-shared/Pagination/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog/ConfirmDialog";
import BulkJsonUploadModal from "../../../components/admin-shared/BulkJsonUpload/BulkJsonUploadModal";
import ToastContainer from "../../../components/admin-shared/Toast/ToastContainer";
import { showToast } from "../../../components/admin-shared/Toast/toast";
import QuizFormModal from "./QuizFormModal";
import "./QuizManagement.css";

const PAGE_SIZE = 10;

const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editQuiz, setEditQuiz] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [quizzesRes, coursesRes] = await Promise.all([
        api.get("/quizzes/"),
        api.get("/courses/"),
      ]);
      setQuizzes(quizzesRes.data.data || quizzesRes.data.quizzes || []);
      setCourses(coursesRes.data.data || coursesRes.data.courses || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load quizzes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const courseTitleById = useMemo(() => {
    const map = {};
    courses.forEach((c) => (map[c._id] = c.title));
    return map;
  }, [courses]);

  const filtered = useMemo(() => {
    if (!search.trim()) return quizzes;
    const q = search.trim().toLowerCase();
    return quizzes.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        (courseTitleById[item.courseId?._id || item.courseId] || "").toLowerCase().includes(q)
    );
  }, [quizzes, search, courseTitleById]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const paginated = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allOnPageSelected =
    paginated.length > 0 && paginated.every((q) => selectedIds.has(q._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginated.forEach((q) => next.delete(q._id));
      else paginated.forEach((q) => next.add(q._id));
      return next;
    });
  };

  const handleDeleteSingle = (quiz) => setConfirmState({ type: "single", target: quiz });
  const handleDeleteSelected = () => setConfirmState({ type: "multi", target: null });
  const handleDeleteAll = () => setConfirmState({ type: "all", target: null });

  const runConfirmedDelete = async () => {
    setActionLoading(true);
    try {
      if (confirmState.type === "single") {
        await api.delete(`/quizzes/${confirmState.target._id}`);
        showToast("Quiz deleted", "success");
      } else if (confirmState.type === "multi") {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => api.delete(`/quizzes/${id}`)));
        showToast(`${ids.length} quiz(zes) deleted`, "success");
        setSelectedIds(new Set());
      } else if (confirmState.type === "all") {
        await Promise.all(quizzes.map((q) => api.delete(`/quizzes/${q._id}`)));
        showToast("All quizzes deleted", "success");
        setSelectedIds(new Set());
      }
      setConfirmState(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkSubmit = async (items) => {
    try {
      const payload = items.map((q) => ({
        title: q.title,
        subject: q.subject,
        totalTime: q.totalTime,
        courseId: q.courseId,
        questions: q.questions,
      }));
      const res = await api.post("/quizzes/", payload);
      showToast(res.data.message || "Quizzes created successfully", "success");
      setShowBulkModal(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Bulk upload failed", "error");
    }
  };

  const columns = [
    { key: "title", label: "Quiz" },
    { key: "subject", label: "Subject" },
    {
      key: "courseId",
      label: "Course",
      render: (row) => courseTitleById[row.courseId?._id || row.courseId] || "—",
    },
    {
      key: "totalTime",
      label: "Time",
      render: (row) => `${row.totalTime} min`,
    },
    {
      key: "questions",
      label: "Questions",
      render: (row) => row.questions?.length || 0,
    },
  ];

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quiz Management</h1>
          <p className="admin-page-subtitle">Create quizzes and manage their questions.</p>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-ghost" onClick={() => setShowBulkModal(true)}>
            <FiUpload /> Bulk Add
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add Quiz
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, subject, or course…" />
        {selectedIds.size > 0 && (
          <div className="admin-toolbar-selected">
            {selectedIds.size} selected
            <button className="btn btn-danger-outline btn-sm" onClick={handleDeleteSelected}>
              <FiTrash2 /> Delete selected
            </button>
          </div>
        )}
        <button
          className="btn btn-danger-outline btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={handleDeleteAll}
          disabled={quizzes.length === 0}
        >
          <FiTrash2 /> Delete all
        </button>
      </div>

      <div className="admin-card">
        <DataTable
          columns={columns}
          data={paginated}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAllOnPage}
          allSelected={allOnPageSelected}
          emptyProps={{
            icon: <FiHelpCircle />,
            title: search ? "No matching quizzes" : "No quizzes yet",
            subtitle: search ? "Try a different search term." : "Add your first quiz to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="Edit quiz" onClick={() => setEditQuiz(row)}>
                <FiEdit2 />
              </button>
              <button
                className="btn-icon danger"
                title="Delete quiz"
                onClick={() => handleDeleteSingle(row)}
              >
                <FiTrash2 />
              </button>
            </div>
          )}
        />
        <Pagination page={pageSafe} pages={pages} total={filtered.length} onPageChange={setPage} />
      </div>

      {showAddModal && (
        <QuizFormModal
          mode="add"
          courses={courses}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchAll();
          }}
        />
      )}

      {editQuiz && (
        <QuizFormModal
          mode="edit"
          quiz={editQuiz}
          courses={courses}
          onClose={() => setEditQuiz(null)}
          onSuccess={() => {
            setEditQuiz(null);
            fetchAll();
          }}
        />
      )}

      {showBulkModal && (
        <BulkJsonUploadModal
          title="Bulk add quizzes"
          requiredFields={["title", "subject", "totalTime", "courseId", "questions[]"]}
          sampleJson={`[\n  {\n    "title": "JS Basics Quiz",\n    "subject": "JavaScript",\n    "totalTime": 15,\n    "courseId": "64f...courseId",\n    "questions": [\n      {\n        "question": "What keyword declares a constant?",\n        "options": ["var", "let", "const", "static"],\n        "correctAnswer": "const"\n      }\n    ]\n  }\n]`}
          onSubmit={handleBulkSubmit}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all"
              ? "Delete all quizzes?"
              : confirmState.type === "multi"
              ? `Delete ${selectedIds.size} quizzes?`
              : "Delete this quiz?"
          }
          message={
            confirmState.type === "all"
              ? "This permanently deletes every quiz. This cannot be undone."
              : confirmState.type === "multi"
              ? "This permanently deletes all selected quizzes. This cannot be undone."
              : `This permanently deletes "${confirmState.target?.title}". This cannot be undone.`
          }
          loading={actionLoading}
          onConfirm={runConfirmedDelete}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  );
};

export default QuizManagement;
