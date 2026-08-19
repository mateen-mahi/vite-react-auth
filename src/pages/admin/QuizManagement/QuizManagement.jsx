import { useEffect, useMemo, useState, useCallback } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiHelpCircle } from "react-icons/fi";
import api from "../../../services/api";
import useListQuery from "../../../components/admin-shared/useListQuery";
import DataTable from "../../../components/admin-shared/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar";
import FilterBar from "../../../components/admin-shared/FilterBar";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast.js";
import QuizFormModal from "./QuizFormModal";
import "./QuizManagement.css";

// GET /api/quizzes — sortable: title|subject|totalTime|createdAt.
// Filters: courseId, subject (partial match), search (title).
const QuizManagement = () => {
  const list = useListQuery({
    endpoint: "/quizzes",
    defaultSortBy: "createdAt",
    defaultOrder: "desc",
    limit: 10,
    initialFilters: { courseId: "" },
    parseResponse: (data) => ({ items: data.data, total: data.total, pages: data.pages }),
  });

  const [courses, setCourses] = useState([]);
  useEffect(() => {
    api.get("/courses", { params: { limit: 500 } })
      .then((res) => setCourses(res.data.data || []))
      .catch(() => {});
  }, []);

  const courseTitleById = useMemo(() => {
    const map = {};
    courses.forEach((c) => (map[c._id] = c.title));
    return map;
  }, [courses]);

  const FILTER_CONFIG = [
    { key: "courseId", label: "Course", options: courses.map((c) => ({ value: c._id, label: c.title })) },
  ];

  // "subject" is its own partial-match filter (separate from the title
  // search box), so it gets its own small debounce rather than piggy-
  // backing on useListQuery's built-in one.
  const [subjectInput, setSubjectInput] = useState("");
  const applySubjectFilter = useCallback((value) => {
    list.setFilter("subject", value.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = setTimeout(() => applySubjectFilter(subjectInput), 400);
    return () => clearTimeout(t);
  }, [subjectInput, applySubjectFilter]);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editQuiz, setEditQuiz] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allOnPageSelected = list.items.length > 0 && list.items.every((q) => selectedIds.has(q._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) list.items.forEach((q) => next.delete(q._id));
      else list.items.forEach((q) => next.add(q._id));
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
        const res = await api.get("/quizzes", { params: { page: 1, limit: 10000 } });
        const all = res.data.data || [];
        await Promise.all(all.map((q) => api.delete(`/quizzes/${q._id}`)));
        showToast("All quizzes deleted", "success");
        setSelectedIds(new Set());
      }
      setConfirmState(null);
      list.refetch();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: "title", label: "Quiz", sortable: true },
    { key: "subject", label: "Subject", sortable: true },
    {
      key: "courseId",
      label: "Course",
      render: (row) => courseTitleById[row.courseId?._id || row.courseId] || "—",
    },
    { key: "totalTime", label: "Time", sortable: true, render: (row) => `${row.totalTime} min` },
    { key: "questions", label: "Questions", render: (row) => row.questionCount|| 0 },
  ];

  const hasActiveQuery = !!list.search || !!list.filters.courseId || !!subjectInput;

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quiz Management</h1>
          <p className="admin-page-subtitle">
            Create quizzes and manage their questions — add single or bulk via one form.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add Quiz
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar value={list.search} onChange={list.setSearch} placeholder="Search by title…" />
        <div className="filter-select-wrap">
          <input
            className="field-input"
            style={{ minWidth: 160 }}
            placeholder="Filter by subject…"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
          />
        </div>
        <FilterBar filters={list.filters} onChange={list.setFilter} onReset={list.resetFilters} config={FILTER_CONFIG} showReset={false} />
        {selectedIds.size > 0 && (
          <div className="admin-toolbar-selected">
            {selectedIds.size} selected
            <button className="btn btn-danger-outline btn-sm" onClick={handleDeleteSelected}>
              <FiTrash2 /> Delete selected
            </button>
          </div>
        )}
        <button
          className="btn btn-danger-outline btn-sm admin-toolbar-spacer"
          onClick={handleDeleteAll}
          disabled={list.total === 0}
        >
          <FiTrash2 /> Delete all
        </button>
      </div>

      <div className="admin-card">
        <DataTable
          columns={columns}
          data={list.items}
          loading={list.loading}
          selectable
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAllOnPage}
          allSelected={allOnPageSelected}
          sortBy={list.sortBy}
          order={list.order}
          onSort={list.toggleSort}
          emptyProps={{
            icon: <FiHelpCircle />,
            title: hasActiveQuery ? "No matching quizzes" : "No quizzes yet",
            subtitle: hasActiveQuery ? "Try a different search term or filter." : "Add your first quiz to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="Edit quiz" onClick={() => setEditQuiz(row)}>
                <FiEdit2 />
              </button>
              <button className="btn-icon danger" title="Delete quiz" onClick={() => handleDeleteSingle(row)}>
                <FiTrash2 />
              </button>
            </div>
          )}
        />
        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          limit={list.limit}
          onPageChange={list.setPage}
          onLimitChange={list.setLimit}
        />
      </div>

      {showAddModal && (
        <QuizFormModal
          mode="add"
          courses={courses}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); list.refetch(); }}
        />
      )}

      {editQuiz && (
        <QuizFormModal
          mode="edit"
          quiz={editQuiz}
          courses={courses}
          onClose={() => setEditQuiz(null)}
          onSuccess={() => { setEditQuiz(null); list.refetch(); }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all" ? "Delete all quizzes?" :
            confirmState.type === "multi" ? `Delete ${selectedIds.size} quizzes?` :
            "Delete this quiz?"
          }
          message={
            confirmState.type === "all" ? "This permanently deletes every quiz. This cannot be undone." :
            confirmState.type === "multi" ? "This permanently deletes all selected quizzes. This cannot be undone." :
            `This permanently deletes "${confirmState.target?.title}". This cannot be undone.`
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
