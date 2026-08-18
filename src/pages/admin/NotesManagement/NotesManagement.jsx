import { useEffect, useMemo, useState, useCallback } from "react";
import { FiTrash2, FiFileText, FiStar } from "react-icons/fi";
import api from "../../../services/api";
import DataTable from "../../../components/admin-shared/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast.js";
import "./NotesManagement.css";

const PAGE_SIZE = 10;

const NotesManagement = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notes/");
      setNotes(res.data.data || res.data.notes || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.trim().toLowerCase();
    return notes.filter(
      (n) =>
        n.title?.toLowerCase().includes(q) ||
        n.owner?.username?.toLowerCase().includes(q) ||
        n.owner?.email?.toLowerCase().includes(q)
    );
  }, [notes, search]);

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
    paginated.length > 0 && paginated.every((n) => selectedIds.has(n._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginated.forEach((n) => next.delete(n._id));
      else paginated.forEach((n) => next.add(n._id));
      return next;
    });
  };

  const handleDeleteSingle = (note) => setConfirmState({ type: "single", target: note });
  const handleDeleteSelected = () => setConfirmState({ type: "multi", target: null });
  const handleDeleteAll = () => setConfirmState({ type: "all", target: null });

  const runConfirmedDelete = async () => {
    setActionLoading(true);
    try {
      if (confirmState.type === "single") {
        await api.delete(`/notes/${confirmState.target._id}`);
        showToast("Note deleted", "success");
      } else if (confirmState.type === "multi") {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => api.delete(`/notes/${id}`)));
        showToast(`${ids.length} note(s) deleted`, "success");
        setSelectedIds(new Set());
      } else if (confirmState.type === "all") {
        await Promise.all(notes.map((n) => api.delete(`/notes/${n._id}`)));
        showToast("All notes deleted", "success");
        setSelectedIds(new Set());
      }
      setConfirmState(null);
      fetchNotes();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    {
      key: "owner",
      label: "Owner",
      render: (row) => row.owner?.username || row.owner?.email || "—",
    },
    {
      key: "pinned",
      label: "Pinned",
      render: (row) =>
        row.pinned ? (
          <span className="status-badge status-warning">
            <FiStar /> Pinned
          </span>
        ) : (
          <span className="status-badge status-info">Not pinned</span>
        ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"),
    },
  ];

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Notes Management</h1>
          <p className="admin-page-subtitle">View and remove notes created by users.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or owner…" />
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
          disabled={notes.length === 0}
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
            icon: <FiFileText />,
            title: search ? "No matching notes" : "No notes yet",
            subtitle: search ? "Try a different search term." : "User notes will show up here.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button
                className="btn-icon danger"
                title="Delete note"
                onClick={() => handleDeleteSingle(row)}
              >
                <FiTrash2 />
              </button>
            </div>
          )}
        />
        <Pagination page={pageSafe} pages={pages} total={filtered.length} onPageChange={setPage} />
      </div>

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all"
              ? "Delete all notes?"
              : confirmState.type === "multi"
              ? `Delete ${selectedIds.size} notes?`
              : "Delete this note?"
          }
          message={
            confirmState.type === "all"
              ? "This permanently deletes every note. This cannot be undone."
              : confirmState.type === "multi"
              ? "This permanently deletes all selected notes. This cannot be undone."
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

export default NotesManagement;
