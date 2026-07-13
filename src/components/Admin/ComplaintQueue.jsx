// src/components/admin/ComplaintQueue.jsx
import { useState, useMemo } from "react";
import { FiSearch, FiClock, FiUsers } from "react-icons/fi";
import { DUMMY_COMPLAINTS } from "../../data/dummyAdminData";
import Pagination from "./Pagination";

const PAGE_SIZE = 8;
const STATUS_CLASS = { pending: "unverified", "in progress": "info", resolved: "verified" };
const SLA_DAYS = 3;

const daysAgo = (dateStr) => Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));

export default function ComplaintQueue() {
  const [complaints, setComplaints] = useState(DUMMY_COMPLAINTS); // TODO: fetch from GET /all-complaints
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  // 3+ complaints from the same user
  const repeatUserIds = useMemo(() => {
    const counts = {};
    DUMMY_COMPLAINTS.forEach((c) => { counts[c.userId] = (counts[c.userId] || 0) + 1; });
    return new Set(Object.keys(counts).filter((id) => counts[id] >= 3));
  }, []);

  const filtered = useMemo(() => {
    let list = complaints;
    if (search) {
      list = list.filter(
        (c) => c.subject.toLowerCase().includes(search.toLowerCase()) ||
               c.username.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status !== "All") list = list.filter((c) => c.status === status);
    return list;
  }, [complaints, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // TODO: wire to PUT /update-status/:complaintId
  const updateStatus = (id, newStatus) =>
    setComplaints((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c))
    );

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Complaints Management</h2>
        <span className="admin-panel-count">{filtered.length} complaints</span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FiSearch className="admin-search-icon" />
          <input
            className="admin-search"
            placeholder="Search subject or user…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="admin-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {["All", "pending", "in progress", "resolved"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Subject</th><th>User</th><th>Status</th><th>Age</th><th>Update</th></tr>
          </thead>
          <tbody>
            {pageItems.map((c) => {
              const age = daysAgo(c.createdAt);
              const slaBreach = c.status === "pending" && age > SLA_DAYS;
              return (
                <tr key={c._id}>
                  <td className="admin-cell-primary">{c.subject}</td>
                  <td>
                    {c.username}
                    {repeatUserIds.has(c.userId) && (
                      <span className="admin-flag-badge" style={{ marginLeft: 8 }}><FiUsers /> Repeat</span>
                    )}
                  </td>
                  <td><span className={`admin-status-badge ${STATUS_CLASS[c.status]}`}>{c.status}</span></td>
                  <td>
                    {age}d
                    {slaBreach && (
                      <span className="admin-flag-badge" style={{ marginLeft: 8 }}><FiClock /> SLA</span>
                    )}
                  </td>
                  <td>
                    <select
                      className="admin-select-sm"
                      value={c.status}
                      onChange={(e) => updateStatus(c._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
