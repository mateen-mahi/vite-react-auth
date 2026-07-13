// src/components/admin/UserTable.jsx
import { useState, useMemo } from "react";
import { FiSearch, FiCheckCircle, FiSlash, FiShield } from "react-icons/fi";
import { DUMMY_USERS } from "../../data/dummyAdminData";
import Pagination from "./Pagination";

const PAGE_SIZE = 8;
const ROLES = ["All", "end-user", "admin", "super-admin"];

export default function UserTable() {
  // Local copy so the dummy verify/ban/promote actions can mutate something.
  // TODO: replace with real state fetched from GET /users/all-users
  const [users, setUsers] = useState(DUMMY_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [verifiedFilter, setVerifiedFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = users;
    if (search) {
      list = list.filter(
        (u) => u.username.toLowerCase().includes(search.toLowerCase()) ||
               u.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (roleFilter !== "All") list = list.filter((u) => u.role === roleFilter);
    if (verifiedFilter !== "All") {
      list = list.filter((u) => (verifiedFilter === "Verified" ? u.isVerified : !u.isVerified));
    }
    return list;
  }, [users, search, roleFilter, verifiedFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // TODO: wire these to PATCH /users/:id/verify, /ban, /promote
  const toggleVerify = (id) => setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isVerified: !u.isVerified } : u)));
  const toggleBan    = (id) => setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u)));
  const promote      = (id) => setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role: u.role === "end-user" ? "admin" : u.role } : u)));

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">User Management</h2>
        <span className="admin-panel-count">{filtered.length} users</span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FiSearch className="admin-search-icon" />
          <input
            className="admin-search"
            placeholder="Search username or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="admin-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          {ROLES.map((r) => <option key={r} value={r}>{r === "All" ? "All Roles" : r}</option>)}
        </select>
        <select className="admin-select" value={verifiedFilter} onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}>
          <option value="All">All Statuses</option>
          <option value="Verified">Verified</option>
          <option value="Unverified">Unverified</option>
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Last Seen</th><th></th></tr>
          </thead>
          <tbody>
            {pageItems.map((u) => (
              <tr key={u._id}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-avatar-sm">{u.username[0].toUpperCase()}</div>
                    <div>
                      <p className="admin-cell-primary">{u.username}</p>
                      <p className="admin-cell-secondary">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td><span className={`admin-role-badge ${u.role}`}>{u.role}</span></td>
                <td>
                  <span className={`admin-status-badge ${u.isVerified ? "verified" : "unverified"}`}>
                    {u.isVerified ? "Verified" : "Unverified"}
                  </span>
                  {u.status === "banned" && <span className="admin-status-badge banned">Banned</span>}
                </td>
                <td className="admin-cell-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="admin-cell-secondary">{new Date(u.lastSeen).toLocaleDateString()}</td>
                <td>
                  <div className="admin-row-actions">
                    <button title="Toggle verify" onClick={() => toggleVerify(u._id)}><FiCheckCircle /></button>
                    <button title="Ban / unban" onClick={() => toggleBan(u._id)}><FiSlash /></button>
                    <button title="Promote" onClick={() => promote(u._id)}><FiShield /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
