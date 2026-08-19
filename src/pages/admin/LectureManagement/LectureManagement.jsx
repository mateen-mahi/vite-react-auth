import { useEffect, useMemo, useState, useCallback } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiPlayCircle } from "react-icons/fi";
import api from "../../../services/api";
import useListQuery from "../../../components/admin-shared/useListQuery";
import DataTable from "../../../components/admin-shared/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar";
import FilterBar from "../../../components/admin-shared/FilterBar";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast";
import LectureFormModal from "./LectureFormModal";
import "./LectureManagement.css";

// GET /api/lectures — sortable: title|duration|createdAt. Filters: courseId, search.
const LectureManagement = () => {
  const list = useListQuery({
    endpoint: "/lectures",
    defaultSortBy: "createdAt",
    defaultOrder: "desc",
    limit: 10,
    initialFilters: { courseId: "" },
    parseResponse: (data) => ({ items: data.data, total: data.total, pages: data.pages }),
  });

  // Course list — used for the filter dropdown AND to resolve course
  // titles in the table (the lecture record only carries a courseId).
  const [courses, setCourses] = useState([]);
  const fetchCourses = useCallback(() => {
    api.get("/courses", { params: { limit: 500 } })
      .then((res) => setCourses(res.data.data || []))
      .catch(() => {});
  }, []);
  useEffect(fetchCourses, [fetchCourses]);

  const courseTitleById = useMemo(() => {
    const map = {};
    courses.forEach((c) => (map[c._id] = c.title));
    return map;
  }, [courses]);

  const FILTER_CONFIG = [
    {
      key: "courseId",
      label: "Course",
      options: courses.map((c) => ({ value: c._id, label: c.title })),
    },
  ];

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLecture, setEditLecture] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allOnPageSelected = list.items.length > 0 && list.items.every((l) => selectedIds.has(l._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) list.items.forEach((l) => next.delete(l._id));
      else list.items.forEach((l) => next.add(l._id));
      return next;
    });
  };

  const handleDeleteSingle = (lecture) => setConfirmState({ type: "single", target: lecture });
  const handleDeleteSelected = () => setConfirmState({ type: "multi", target: null });
  const handleDeleteAll = () => setConfirmState({ type: "all", target: null });

  const runConfirmedDelete = async () => {
    setActionLoading(true);
    try {
      if (confirmState.type === "single") {
        await api.delete(`/lectures/${confirmState.target._id}`);
        showToast("Lecture deleted", "success");
      } else if (confirmState.type === "multi") {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => api.delete(`/lectures/${id}`)));
        showToast(`${ids.length} lecture(s) deleted`, "success");
        setSelectedIds(new Set());
      } else if (confirmState.type === "all") {
        const res = await api.get("/lectures", { params: { page: 1, limit: 10000 } });
        const all = res.data.data || [];
        await Promise.all(all.map((l) => api.delete(`/lectures/${l._id}`)));
        showToast("All lectures deleted", "success");
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
    {
      key: "title",
      label: "Lecture",
      sortable: true,
      render: (row) => (
        <div>
          <div className="lecture-title">{row.title}</div>
          <div className="lecture-video">{row.videoId}</div>
        </div>
      ),
    },
    {
      key: "course",
      label: "Course",
      render: (row) => courseTitleById[row.course?._id || row.course] || "—",
    },
    { key: "duration", label: "Duration", sortable: true, render: (row) => `${row.duration}m` },
  ];

  const hasActiveQuery = !!list.search || !!list.filters.courseId;

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lecture Management</h1>
          <p className="admin-page-subtitle">
            Create and organize lectures within courses — add single or bulk via one form.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add Lecture
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar value={list.search} onChange={list.setSearch} placeholder="Search by title…" />
        <FilterBar filters={list.filters} onChange={list.setFilter} onReset={list.resetFilters} config={FILTER_CONFIG} />
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
            icon: <FiPlayCircle />,
            title: hasActiveQuery ? "No matching lectures" : "No lectures yet",
            subtitle: hasActiveQuery ? "Try a different search term or filter." : "Add your first lecture to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="Edit lecture" onClick={() => setEditLecture(row)}>
                <FiEdit2 />
              </button>
              <button className="btn-icon danger" title="Delete lecture" onClick={() => handleDeleteSingle(row)}>
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
        <LectureFormModal
          mode="add"
          courses={courses}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); list.refetch(); }}
        />
      )}

      {editLecture && (
        <LectureFormModal
          mode="edit"
          lecture={editLecture}
          courses={courses}
          onClose={() => setEditLecture(null)}
          onSuccess={() => { setEditLecture(null); list.refetch(); }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all" ? "Delete all lectures?" :
            confirmState.type === "multi" ? `Delete ${selectedIds.size} lectures?` :
            "Delete this lecture?"
          }
          message={
            confirmState.type === "all" ? "This permanently deletes every lecture. This cannot be undone." :
            confirmState.type === "multi" ? "This permanently deletes all selected lectures. This cannot be undone." :
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

export default LectureManagement;
