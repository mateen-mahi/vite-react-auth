import { useState } from "react";
import { FiTrash2, FiMessageSquare, FiCornerUpLeft } from "react-icons/fi";
import api from "../../../services/api";
import useListQuery from "../../../components/admin-shared/useListQuery";
import DataTable from "../../../components/admin-shared/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar";
import FilterBar from "../../../components/admin-shared/FilterBar";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast.js";
import ComplaintReplyModal from "./ComplaintReplyModal";
import "./ComplaintManagement.css";

const STATUS_CLASS = {
  pending: "status-warning",
  "in progress": "status-info",
  resolved: "status-success",
};

// GET /api/admin/complaints — sortable: status|subject|createdAt|updatedAt.
// Filters: status, search (subject). Note: search now matches subject
// only — the old client-side filter also matched user name/email/status
// text, which the API filter doesn't do; status has its own dropdown
// below to cover that part.
const FILTER_CONFIG = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "pending", label: "Pending" },
      { value: "in progress", label: "In Progress" },
      { value: "resolved", label: "Resolved" },
    ],
  },
];

const ComplaintManagement = () => {
  const list = useListQuery({
    endpoint: "/admin/complaints",
    defaultSortBy: "createdAt",
    defaultOrder: "desc",
    limit: 10,
    initialFilters: { status: "" },
    parseResponse: (data) => ({
      items: data.complaints,
      total: data.totalComplaints,
      pages: data.totalPages,
    }),
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [replyComplaint, setReplyComplaint] = useState(null);
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

  const handleDeleteSingle = (complaint) => setConfirmState({ type: "single", target: complaint });
  const handleDeleteSelected = () => setConfirmState({ type: "multi", target: null });
  const handleDeleteAll = () => setConfirmState({ type: "all", target: null });

  const runConfirmedDelete = async () => {
    setActionLoading(true);
    try {
      if (confirmState.type === "single") {
        await api.delete(`/complaints/delete-complaint/${confirmState.target._id}`);
        showToast("Complaint deleted", "success");
      } else if (confirmState.type === "multi") {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => api.delete(`/complaints/delete-complaint/${id}`)));
        showToast(`${ids.length} complaint(s) deleted`, "success");
        setSelectedIds(new Set());
      } else if (confirmState.type === "all") {
        await api.delete("/complaints/clear-all-complaints");
        showToast("All complaints deleted", "success");
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
      key: "user",
      label: "User",
      render: (row) => (
        <div>
          <div className="complaint-user-name">{row.userId?.username || "Unknown"}</div>
          <div className="complaint-user-email">{row.userId?.email || "—"}</div>
        </div>
      ),
    },
    { key: "subject", label: "Subject", sortable: true },
    {
      key: "description",
      label: "Description",
      render: (row) => <span className="truncate-cell">{row.description}</span>,
    },
    {
      key: "answer",
      label: "Answer",
      render: (row) =>
        row.answer ? <span className="truncate-cell">{row.answer}</span> : <span className="no-answer">Not answered</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span className={`status-badge ${STATUS_CLASS[row.status] || "status-info"}`}>{row.status || "pending"}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"),
    },
  ];

  const hasActiveQuery = !!list.search || !!list.filters.status;

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Complaint Management</h1>
          <p className="admin-page-subtitle">Review, reply to, and resolve user complaints.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar value={list.search} onChange={list.setSearch} placeholder="Search by subject…" />
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
            icon: <FiMessageSquare />,
            title: hasActiveQuery ? "No matching complaints" : "No complaints yet",
            subtitle: hasActiveQuery ? "Try a different search term or filter." : "Complaints will show up here.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="Reply" onClick={() => setReplyComplaint(row)}>
                <FiCornerUpLeft />
              </button>
              <button className="btn-icon danger" title="Delete complaint" onClick={() => handleDeleteSingle(row)}>
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

      {replyComplaint && (
        <ComplaintReplyModal
          complaint={replyComplaint}
          onClose={() => setReplyComplaint(null)}
          onSuccess={() => { setReplyComplaint(null); list.refetch(); }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all" ? "Delete all complaints?" :
            confirmState.type === "multi" ? `Delete ${selectedIds.size} complaints?` :
            "Delete this complaint?"
          }
          message={
            confirmState.type === "all" ? "This permanently deletes every complaint. This cannot be undone." :
            confirmState.type === "multi" ? "This permanently deletes all selected complaints. This cannot be undone." :
            `This permanently deletes the complaint "${confirmState.target?.subject}". This cannot be undone.`
          }
          loading={actionLoading}
          onConfirm={runConfirmedDelete}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  );
};

export default ComplaintManagement;
