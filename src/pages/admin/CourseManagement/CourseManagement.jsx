import { useEffect, useMemo, useState, useCallback } from "react";
import { FiPlus, FiUpload, FiTrash2, FiEdit2, FiBookOpen } from "react-icons/fi";
import api from "../../../services/api";
import DataTable from "../../../components/admin-shared/DataTable/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar/SearchBar";
import Pagination from "../../../components/admin-shared/Pagination/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog/ConfirmDialog";
import BulkJsonUploadModal from "../../../components/admin-shared/BulkJsonUpload/BulkJsonUploadModal";
import ToastContainer from "../../../components/admin-shared/Toast/ToastContainer";
import { showToast } from "../../../components/admin-shared/Toast/toast";
import CourseFormModal from "./CourseFormModal";
import "./CourseManagement.css";

const PAGE_SIZE = 10;

const LEVEL_STATUS = {
  beginner: "status-success",
  intermediate: "status-warning",
  advanced: "status-danger",
};

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/courses/");
      setCourses(res.data.data || res.data.courses || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load courses", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.trim().toLowerCase();
    return courses.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.level?.toLowerCase().includes(q)
    );
  }, [courses, search]);

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
    paginated.length > 0 && paginated.every((c) => selectedIds.has(c._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginated.forEach((c) => next.delete(c._id));
      else paginated.forEach((c) => next.add(c._id));
      return next;
    });
  };

  const handleDeleteSingle = (course) => setConfirmState({ type: "single", target: course });
  const handleDeleteSelected = () => setConfirmState({ type: "multi", target: null });
  const handleDeleteAll = () => setConfirmState({ type: "all", target: null });

  const runConfirmedDelete = async () => {
    setActionLoading(true);
    try {
      if (confirmState.type === "single") {
        await api.delete(`/courses/${confirmState.target._id}`);
        showToast("Course deleted", "success");
      } else if (confirmState.type === "multi") {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => api.delete(`/courses/${id}`)));
        showToast(`${ids.length} course(s) deleted`, "success");
        setSelectedIds(new Set());
      } else if (confirmState.type === "all") {
        // No dedicated "clear all" endpoint for courses — delete every
        // currently loaded course individually.
        await Promise.all(courses.map((c) => api.delete(`/courses/${c._id}`)));
        showToast("All courses deleted", "success");
        setSelectedIds(new Set());
      }
      setConfirmState(null);
      fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Backend supports array bodies for bulk create in one request.
  const handleBulkSubmit = async (items) => {
    try {
      const payload = items.map((c) => ({
        title: c.title,
        description: c.description,
        category: c.category,
        price: c.price,
        duration: c.duration,
        instructor: c.instructor,
        level: c.level,
        color: c.color,
        emoji: c.emoji,
      }));
      const res = await api.post("/courses/", payload);
      showToast(res.data.message || "Courses created successfully", "success");
      setShowBulkModal(false);
      fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || "Bulk upload failed", "error");
    }
  };

  const columns = [
    {
      key: "title",
      label: "Course",
      render: (row) => (
        <div className="course-cell">
          <div className="icon-chip" style={{ background: `${row.color || "#2563eb"}22`, color: row.color || "#2563eb" }}>
            {row.emoji || "📘"}
          </div>
          <div>
            <div className="course-cell-title">{row.title}</div>
            <div className="course-cell-cat">{row.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (row) => `$${row.price}`,
    },
    { key: "duration", label: "Duration" },
    {
      key: "level",
      label: "Level",
      render: (row) => (
        <span className={`status-badge ${LEVEL_STATUS[row.level] || "status-info"}`}>
          {row.level}
        </span>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Course Management</h1>
          <p className="admin-page-subtitle">
            Create, edit, and manage every course on the platform.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-ghost" onClick={() => setShowBulkModal(true)}>
            <FiUpload /> Bulk Add
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add Course
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by title, category, or level…"
        />
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
          disabled={courses.length === 0}
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
            icon: <FiBookOpen />,
            title: search ? "No matching courses" : "No courses yet",
            subtitle: search ? "Try a different search term." : "Add your first course to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="Edit course" onClick={() => setEditCourse(row)}>
                <FiEdit2 />
              </button>
              <button
                className="btn-icon danger"
                title="Delete course"
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
        <CourseFormModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchCourses();
          }}
        />
      )}

      {editCourse && (
        <CourseFormModal
          mode="edit"
          course={editCourse}
          onClose={() => setEditCourse(null)}
          onSuccess={() => {
            setEditCourse(null);
            fetchCourses();
          }}
        />
      )}

      {showBulkModal && (
        <BulkJsonUploadModal
          title="Bulk add courses"
          requiredFields={["title", "description", "category", "price", "duration", "instructor", "level", "color", "emoji"]}
          sampleJson={`[\n  {\n    "title": "Intro to Node.js",\n    "description": "Learn backend fundamentals",\n    "category": "Web Development",\n    "price": 49,\n    "duration": "6 weeks",\n    "instructor": "64f...instructorId",\n    "level": "beginner",\n    "color": "#2563eb",\n    "emoji": "🚀"\n  }\n]`}
          onSubmit={handleBulkSubmit}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all"
              ? "Delete all courses?"
              : confirmState.type === "multi"
              ? `Delete ${selectedIds.size} courses?`
              : "Delete this course?"
          }
          message={
            confirmState.type === "all"
              ? "This permanently deletes every course. This cannot be undone."
              : confirmState.type === "multi"
              ? "This permanently deletes all selected courses. This cannot be undone."
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

export default CourseManagement;
