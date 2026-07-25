import { useEffect, useMemo, useState, useCallback } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiPlayCircle } from "react-icons/fi";
import api from "../../../services/api";
import DataTable from "../../../components/admin-shared/DataTable/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar/SearchBar";
import Pagination from "../../../components/admin-shared/Pagination/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/Toast/ToastContainer";
import { showToast } from "../../../components/admin-shared/Toast/toast";
import LectureFormModal from "./LectureFormModal";
import "./LectureManagement.css";

const PAGE_SIZE = 10;

const LectureManagement = () => {
  const [lectures, setLectures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLecture, setEditLecture] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [lecturesRes, coursesRes] = await Promise.all([
        api.get("/lectures"),
        api.get("/courses"),
      ]);
      setLectures(lecturesRes.data.data || lecturesRes.data.lectures || []);
      setCourses(coursesRes.data.data || coursesRes.data.courses || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load lectures", "error");
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
    if (!search.trim()) return lectures;
    const q = search.trim().toLowerCase();
    return lectures.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        (courseTitleById[l.course?._id || l.course] || "").toLowerCase().includes(q)
    );
  }, [lectures, search, courseTitleById]);

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
    paginated.length > 0 && paginated.every((l) => selectedIds.has(l._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginated.forEach((l) => next.delete(l._id));
      else paginated.forEach((l) => next.add(l._id));
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
        await Promise.all(lectures.map((l) => api.delete(`/lectures/${l._id}`)));
        showToast("All lectures deleted", "success");
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

  const columns = [
    {
      key: "title",
      label: "Lecture",
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
    { key: "duration", label: "Duration", render: (row) => `${row.duration}m` },
  ];

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
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or course…" />
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
          disabled={lectures.length === 0}
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
            icon: <FiPlayCircle />,
            title: search ? "No matching lectures" : "No lectures yet",
            subtitle: search ? "Try a different search term." : "Add your first lecture to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="Edit lecture" onClick={() => setEditLecture(row)}>
                <FiEdit2 />
              </button>
              <button
                className="btn-icon danger"
                title="Delete lecture"
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
        <LectureFormModal
          mode="add"
          courses={courses}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchAll();
          }}
        />
      )}

      {editLecture && (
        <LectureFormModal
          mode="edit"
          lecture={editLecture}
          courses={courses}
          onClose={() => setEditLecture(null)}
          onSuccess={() => {
            setEditLecture(null);
            fetchAll();
          }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all"
              ? "Delete all lectures?"
              : confirmState.type === "multi"
              ? `Delete ${selectedIds.size} lectures?`
              : "Delete this lecture?"
          }
          message={
            confirmState.type === "all"
              ? "This permanently deletes every lecture. This cannot be undone."
              : confirmState.type === "multi"
              ? "This permanently deletes all selected lectures. This cannot be undone."
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

export default LectureManagement;
