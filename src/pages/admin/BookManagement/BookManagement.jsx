import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiFileText, FiDownload } from "react-icons/fi";
import api from "../../../services/api";
import useListQuery from "../../../components/admin-shared/useListQuery";
import DataTable from "../../../components/admin-shared/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar";
import FilterBar from "../../../components/admin-shared/FilterBar";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast.js";
import BookFormModal from "./BookFormModal";
import "./BookManagement.css";

// GET /api/books — sortable: title|createdAt|updatedAt. Filters: courseId, search (title).
// The dedicated /books/search route is no longer needed here — /books now
// accepts `search` directly, so one endpoint covers both browsing and
// searching (fewer branches, one fetch path).
const BookManagement = () => {
  const list = useListQuery({
    endpoint: "/books",
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

  const FILTER_CONFIG = [
    { key: "courseId", label: "Course", options: courses.map((c) => ({ value: c._id, label: c.title })) },
  ];

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allOnPageSelected = list.items.length > 0 && list.items.every((b) => selectedIds.has(b._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) list.items.forEach((b) => next.delete(b._id));
      else list.items.forEach((b) => next.add(b._id));
      return next;
    });
  };

  const handleDeleteSingle = (book) => setConfirmState({ type: "single", target: book });
  const handleDeleteSelected = () => setConfirmState({ type: "multi", target: null });
  const handleDeleteAll = () => setConfirmState({ type: "all", target: null });

  const runConfirmedDelete = async () => {
    setActionLoading(true);
    try {
      if (confirmState.type === "single") {
        await api.delete(`/books/${confirmState.target._id}`);
        showToast("Book deleted", "success");
      } else if (confirmState.type === "multi") {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => api.delete(`/books/${id}`)));
        showToast(`${ids.length} book(s) deleted`, "success");
        setSelectedIds(new Set());
      } else if (confirmState.type === "all") {
        // No clear-all endpoint for books — fetch every page and delete individually.
        const res = await api.get("/books", { params: { page: 1, limit: 10000 } });
        const all = res.data.data || [];
        await Promise.all(all.map((b) => api.delete(`/books/${b._id}`)));
        showToast("All books deleted", "success");
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
      label: "Book",
      sortable: true,
      render: (row) => (
        <div className="book-cell">
          <div className="icon-chip" style={{ background: "var(--pri-tint)", color: "var(--pri)" }}>
            <FiFileText />
          </div>
          <div>
            <div className="book-cell-title">{row.title}</div>
            <div className="book-cell-meta">{row.document?.originalName || "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "courseId", label: "Course", render: (row) => row.courseId?.title || "—" },
    {
      key: "size",
      label: "Size",
      render: (row) => (row.document?.size ? `${(row.document.size / 1024).toFixed(0)} KB` : "—"),
    },
    {
      key: "createdAt",
      label: "Uploaded",
      sortable: true,
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"),
    },
  ];

  const hasActiveQuery = !!list.search || !!list.filters.courseId;

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Book Management</h1>
          <p className="admin-page-subtitle">
            Upload and manage documents (PDF preferred; Word, Excel, and PowerPoint also accepted). One file at a time.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Upload Book
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
            icon: <FiFileText />,
            title: hasActiveQuery ? "No matching books" : "No books yet",
            subtitle: hasActiveQuery ? "Try a different search term or filter." : "Upload your first document to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              {row.document?.url && (
                <a className="btn-icon" title="Download" href={row.document.url} target="_blank" rel="noopener noreferrer">
                  <FiDownload />
                </a>
              )}
              <button className="btn-icon" title="Edit metadata" onClick={() => setEditBook(row)}>
                <FiEdit2 />
              </button>
              <button className="btn-icon danger" title="Delete book" onClick={() => handleDeleteSingle(row)}>
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
        <BookFormModal
          mode="add"
          courses={courses}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); list.refetch(); }}
        />
      )}

      {editBook && (
        <BookFormModal
          mode="edit"
          book={editBook}
          courses={courses}
          onClose={() => setEditBook(null)}
          onSuccess={() => { setEditBook(null); list.refetch(); }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all" ? "Delete all books?" :
            confirmState.type === "multi" ? `Delete ${selectedIds.size} books?` :
            "Delete this book?"
          }
          message={
            confirmState.type === "all" ? "This permanently deletes every book and its file in storage. This cannot be undone." :
            confirmState.type === "multi" ? "This permanently deletes all selected books and their files. This cannot be undone." :
            `This permanently deletes "${confirmState.target?.title}" and its file. This cannot be undone.`
          }
          loading={actionLoading}
          onConfirm={runConfirmedDelete}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  );
};

export default BookManagement;
