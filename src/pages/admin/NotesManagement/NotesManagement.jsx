import { useState } from "react";
import { FiTrash2, FiFileText, FiStar } from "react-icons/fi";
import api from "../../../services/api";
import useListQuery from "../../../components/admin-shared/useListQuery";
import DataTable from "../../../components/admin-shared/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar";
import FilterBar from "../../../components/admin-shared/FilterBar";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast.js";
import "./NotesManagement.css";

// GET /api/notes — sortable: title|createdAt|updatedAt.
// Default sort: isPinned desc, then updatedAt desc.
// Filters: isPinned, search (title only — the API does not search by
// owner, so owner name/email can no longer be part of the free-text
// search like the old client-side filter did; the Owner column is still
// shown, just not searchable).
const FILTER_CONFIG = [
  {
    key: "isPinned",
    label: "Pinned",
    options: [
      { value: "true", label: "Pinned" },
      { value: "false", label: "Not pinned" },
    ],
  },
];

const NotesManagement = () => {
  const list = useListQuery({
    endpoint: "/notes",
    defaultSortBy: "updatedAt",
    defaultOrder: "desc",
    limit: 10,
    initialFilters: { isPinned: "" },
    parseResponse: (data) => ({ items: data.data, total: data.total, pages: data.pages }),
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allOnPageSelected = list.items.length > 0 && list.items.every((n) => selectedIds.has(n._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) list.items.forEach((n) => next.delete(n._id));
      else list.items.forEach((n) => next.add(n._id));
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
        const res = await api.get("/notes", { params: { page: 1, limit: 10000 } });
        const all = res.data.data || [];
        await Promise.all(all.map((n) => api.delete(`/notes/${n._id}`)));
        showToast("All notes deleted", "success");
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
    { key: "title", label: "Title", sortable: true },
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
          <span className="status-badge status-warning"><FiStar /> Pinned</span>
        ) : (
          <span className="status-badge status-info">Not pinned</span>
        ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"),
    },
  ];

  const hasActiveQuery = !!list.search || !!list.filters.isPinned;

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
            title: hasActiveQuery ? "No matching notes" : "No notes yet",
            subtitle: hasActiveQuery ? "Try a different search term or filter." : "User notes will show up here.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon danger" title="Delete note" onClick={() => handleDeleteSingle(row)}>
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

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all" ? "Delete all notes?" :
            confirmState.type === "multi" ? `Delete ${selectedIds.size} notes?` :
            "Delete this note?"
          }
          message={
            confirmState.type === "all" ? "This permanently deletes every note. This cannot be undone." :
            confirmState.type === "multi" ? "This permanently deletes all selected notes. This cannot be undone." :
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

export default NotesManagement;
