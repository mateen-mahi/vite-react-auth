import { useEffect, useMemo, useState, useCallback } from "react";
import { FiTrash2, FiMessageSquare, FiCornerUpLeft } from "react-icons/fi";
import api from "../../../services/api";
import DataTable from "../../../components/admin-shared/DataTable/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar/SearchBar";
import Pagination from "../../../components/admin-shared/Pagination/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/Toast/ToastContainer";
import { showToast } from "../../../components/admin-shared/Toast/toast";
import ComplaintReplyModal from "./ComplaintReplyModal";
import "./ComplaintManagement.css";

const PAGE_SIZE = 10;

const STATUS_CLASS = {
  pending: "status-warning",
  "in progress": "status-info",
  resolved: "status-success",
};

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [replyComplaint, setReplyComplaint] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/complaints/all-complaints");
      setComplaints(res.data.data || res.data.complaints || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load complaints", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const filtered = useMemo(() => {
    if (!search.trim()) return complaints;
    const q = search.trim().toLowerCase();
    return complaints.filter(
      (c) =>
        c.subject?.toLowerCase().includes(q) ||
        c.user?.username?.toLowerCase().includes(q) ||
        c.user?.email?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q)
    );
  }, [complaints, search]);

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
      fetchComplaints();
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
          <div className="complaint-user-name">{row.user?.username || "Unknown"}</div>
          <div className="complaint-user-email">{row.user?.email || "—"}</div>
        </div>
      ),
    },
    { key: "subject", label: "Subject" },
    {
      key: "description",
      label: "Description",
      render: (row) => <span className="truncate-cell">{row.description}</span>,
    },
    {
      key: "answer",
      label: "Answer",
      render: (row) =>
        row.answer ? (
          <span className="truncate-cell">{row.answer}</span>
        ) : (
          <span className="no-answer">Not answered</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`status-badge ${STATUS_CLASS[row.status] || "status-info"}`}>
          {row.status || "pending"}
        </span>
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
          <h1 className="admin-page-title">Complaint Management</h1>
          <p className="admin-page-subtitle">Review, reply to, and resolve user complaints.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by user, subject, or status…"
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
          disabled={complaints.length === 0}
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
            icon: <FiMessageSquare />,
            title: search ? "No matching complaints" : "No complaints yet",
            subtitle: search ? "Try a different search term." : "Complaints will show up here.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="Reply" onClick={() => setReplyComplaint(row)}>
                <FiCornerUpLeft />
              </button>
              <button
                className="btn-icon danger"
                title="Delete complaint"
                onClick={() => handleDeleteSingle(row)}
              >
                <FiTrash2 />
              </button>
            </div>
          )}
        />
        <Pagination page={pageSafe} pages={pages} total={filtered.length} onPageChange={setPage} />
      </div>

      {replyComplaint && (
        <ComplaintReplyModal
          complaint={replyComplaint}
          onClose={() => setReplyComplaint(null)}
          onSuccess={() => {
            setReplyComplaint(null);
            fetchComplaints();
          }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all"
              ? "Delete all complaints?"
              : confirmState.type === "multi"
              ? `Delete ${selectedIds.size} complaints?`
              : "Delete this complaint?"
          }
          message={
            confirmState.type === "all"
              ? "This permanently deletes every complaint. This cannot be undone."
              : confirmState.type === "multi"
              ? "This permanently deletes all selected complaints. This cannot be undone."
              : `This permanently deletes the complaint "${confirmState.target?.subject}". This cannot be undone.`
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
