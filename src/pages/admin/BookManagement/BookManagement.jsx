import { useEffect, useMemo, useState, useCallback } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiFileText, FiDownload } from "react-icons/fi";
import api from "../../../services/api";
import DataTable from "../../../components/admin-shared/DataTable/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar/SearchBar";
import Pagination from "../../../components/admin-shared/Pagination/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/Toast/ToastContainer";
import { showToast } from "../../../components/admin-shared/Toast/toast";
import BookFormModal from "./BookFormModal";
import "./BookManagement.css";

const PAGE_SIZE = 10;

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Your book.controller.js already supports server-side pagination
  // (and a dedicated /books/search route), so this page uses those
  // directly instead of fetching everything and filtering client-side.
  const fetchBooks = useCallback(async (targetPage, query) => {
    setLoading(true);
    try {
      const res = query?.trim()
        ? await api.get("/books/search", { params: { q: query, page: targetPage, limit: PAGE_SIZE } })
        : await api.get("/books", { params: { page: targetPage, limit: PAGE_SIZE } });
      setBooks(res.data.data || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load books", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .get("/courses")
      .then((res) => setCourses(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBooks(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Debounce search so we don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchBooks(1, search);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allOnPageSelected = books.length > 0 && books.every((b) => selectedIds.has(b._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) books.forEach((b) => next.delete(b._id));
      else books.forEach((b) => next.add(b._id));
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
        // No clear-all endpoint for books — fetch every page and delete
        // individually. Simple approach: refetch with a large limit.
        const res = await api.get("/books", { params: { page: 1, limit: 10000 } });
        const all = res.data.data || [];
        await Promise.all(all.map((b) => api.delete(`/books/${b._id}`)));
        showToast("All books deleted", "success");
        setSelectedIds(new Set());
      }
      setConfirmState(null);
      fetchBooks(1, search);
      setPage(1);
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
    {
      key: "courseId",
      label: "Course",
      render: (row) => row.courseId?.title || "—",
    },
    {
      key: "size",
      label: "Size",
      render: (row) => (row.document?.size ? `${(row.document.size / 1024).toFixed(0)} KB` : "—"),
    },
    {
      key: "createdAt",
      label: "Uploaded",
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"),
    },
  ];

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
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or description…" />
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
          disabled={total === 0}
        >
          <FiTrash2 /> Delete all
        </button>
      </div>

      <div className="admin-card">
        <DataTable
          columns={columns}
          data={books}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAllOnPage}
          allSelected={allOnPageSelected}
          emptyProps={{
            icon: <FiFileText />,
            title: search ? "No matching books" : "No books yet",
            subtitle: search ? "Try a different search term." : "Upload your first document to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              {row.document?.url && (
                <a
                  className="btn-icon"
                  title="Download"
                  href={row.document.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiDownload />
                </a>
              )}
              <button className="btn-icon" title="Edit metadata" onClick={() => setEditBook(row)}>
                <FiEdit2 />
              </button>
              <button
                className="btn-icon danger"
                title="Delete book"
                onClick={() => handleDeleteSingle(row)}
              >
                <FiTrash2 />
              </button>
            </div>
          )}
        />
        <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>

      {showAddModal && (
        <BookFormModal
          mode="add"
          courses={courses}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchBooks(1, search);
            setPage(1);
          }}
        />
      )}

      {editBook && (
        <BookFormModal
          mode="edit"
          book={editBook}
          courses={courses}
          onClose={() => setEditBook(null)}
          onSuccess={() => {
            setEditBook(null);
            fetchBooks(page, search);
          }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all"
              ? "Delete all books?"
              : confirmState.type === "multi"
              ? `Delete ${selectedIds.size} books?`
              : "Delete this book?"
          }
          message={
            confirmState.type === "all"
              ? "This permanently deletes every book and its file in storage. This cannot be undone."
              : confirmState.type === "multi"
              ? "This permanently deletes all selected books and their files. This cannot be undone."
              : `This permanently deletes "${confirmState.target?.title}" and its file. This cannot be undone.`
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
