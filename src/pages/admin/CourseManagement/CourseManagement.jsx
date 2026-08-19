import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiBookOpen, FiUserPlus } from "react-icons/fi";
import api from "../../../services/api";
import useListQuery from "../../../components/admin-shared/useListQuery";
import DataTable from "../../../components/admin-shared/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar";
import FilterBar from "../../../components/admin-shared/FilterBar";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast";
import CourseFormModal from "./CourseFormModal";
import EnrollmentModal from "./EnrollmentModal";
import "./CourseManagement.css";

const LEVEL_STATUS = {
  Beginner: "status-success",
  Intermediate: "status-warning",
  Advanced: "status-danger",
};

// GET /api/courses — sortable: title|price|duration|level|category|createdAt.
// Filters: category, level, featured, search.
const CourseManagement = () => {
  const list = useListQuery({
    endpoint: "/courses",
    defaultSortBy: "createdAt",
    defaultOrder: "desc",
    limit: 10,
    initialFilters: { category: "", level: "", featured: "" },
    parseResponse: (data) => ({ items: data.data, total: data.total, pages: data.pages }),
  });

  // Category options aren't in the reference doc's whitelist (it's free
  // text set by whoever creates the course), so build the filter dropdown
  // from whatever categories currently exist — fetched once, independent
  // of the paginated/filtered table above.
  const [categoryOptions, setCategoryOptions] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/courses", { params: { limit: 200, sortBy: "category", order: "asc" } });
        const unique = [...new Set((res.data.data || []).map((c) => c.category))].filter(Boolean);
        setCategoryOptions(unique.map((c) => ({ value: c, label: c })));
      } catch (err) {
        console.log("Failed to fetch categories:", err);
      }
    })();
  }, []);

  const FILTER_CONFIG = [
    { key: "category", label: "Category", options: categoryOptions },
    {
      key: "level",
      label: "Level",
      options: [
        { value: "Beginner", label: "Beginner" },
        { value: "Intermediate", label: "Intermediate" },
        { value: "Advanced", label: "Advanced" },
      ],
    },
    {
      key: "featured",
      label: "Featured",
      options: [
        { value: "true", label: "Featured" },
        { value: "false", label: "Not featured" },
      ],
    },
  ];

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [enrollCourse, setEnrollCourse] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allOnPageSelected = list.items.length > 0 && list.items.every((c) => selectedIds.has(c._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) list.items.forEach((c) => next.delete(c._id));
      else list.items.forEach((c) => next.add(c._id));
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
        // No clear-all endpoint — pull every course (unfiltered) and
        // delete individually.
        const res = await api.get("/courses", { params: { page: 1, limit: 10000 } });
        const all = res.data.data || [];
        await Promise.all(all.map((c) => api.delete(`/courses/${c._id}`)));
        showToast("All courses deleted", "success");
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
      label: "Course",
      sortable: true,
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
    { key: "price", label: "Price", sortable: true, render: (row) => `$${row.price}` },
    { key: "duration", label: "Duration", sortable: true, render: (row) => `${row.duration}h` },
    {
      key: "level",
      label: "Level",
      sortable: true,
      render: (row) => <span className={`status-badge ${LEVEL_STATUS[row.level] || "status-info"}`}>{row.level}</span>,
    },
    { key: "studentsEnrolled", label: "Enrolled", render: (row) => row.studentsEnrolled?.length ?? 0 },
  ];

  const hasActiveQuery = !!list.search || Object.values(list.filters).some((v) => v);

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Course Management</h1>
          <p className="admin-page-subtitle">
            Create, edit, and manage every course on the platform — add single or bulk via one form.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add Course
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
            icon: <FiBookOpen />,
            title: hasActiveQuery ? "No matching courses" : "No courses yet",
            subtitle: hasActiveQuery ? "Try a different search term or filter." : "Add your first course to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="Enroll / Unenroll student" onClick={() => setEnrollCourse(row)}>
                <FiUserPlus />
              </button>
              <button className="btn-icon" title="Edit course" onClick={() => setEditCourse(row)}>
                <FiEdit2 />
              </button>
              <button className="btn-icon danger" title="Delete course" onClick={() => handleDeleteSingle(row)}>
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
        <CourseFormModal mode="add" onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); list.refetch(); }} />
      )}

      {editCourse && (
        <CourseFormModal
          mode="edit"
          course={editCourse}
          onClose={() => setEditCourse(null)}
          onSuccess={() => { setEditCourse(null); list.refetch(); }}
        />
      )}

      {enrollCourse && (
        <EnrollmentModal
          course={enrollCourse}
          onClose={() => setEnrollCourse(null)}
          onSuccess={() => { setEnrollCourse(null); list.refetch(); }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all" ? "Delete all courses?" :
            confirmState.type === "multi" ? `Delete ${selectedIds.size} courses?` :
            "Delete this course?"
          }
          message={
            confirmState.type === "all" ? "This permanently deletes every course. This cannot be undone." :
            confirmState.type === "multi" ? "This permanently deletes all selected courses. This cannot be undone." :
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

export default CourseManagement;
