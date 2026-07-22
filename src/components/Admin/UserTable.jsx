// src/components/admin/UserTable.jsx
import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiCheckCircle, FiSlash, FiShield, FiTrash2, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import api from "../../services/api";
import { useAdminSocket } from "../../custom-hooks/useAdminSocket";
import Pagination from "./Pagination";

const PAGE_SIZE = 8;
const ROLES = ["All", "end-user", "admin", "super-admin"];

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [verifiedFilter, setVerifiedFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null); // disables row buttons while a request for that row is in flight
  const { subscribe } = useAdminSocket();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/users/all-users");
        setUsers(res.data.users || []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Couldn't load users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Live: a new user registers → prepend to the table without refetching
  useEffect(() => {
    const cleanup = subscribe("user:registered", (newUser) => {
      setUsers((prev) => {
        if (prev.some((u) => u._id === newUser._id)) return prev; // avoid dupes
        return [
          { ...newUser, imageUrl: newUser.imageUrl || null, status: "active" },
          ...prev,
        ];
      });
    });
    return cleanup;
  }, [subscribe]);

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

  // ---- real update calls, all via PUT /users/edit-user/:id ----
  // Pattern: optimistic update → real request → revert on failure.
  const patchUser = async (id, patch, revertPatch) => {
    setBusyId(id);
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...patch } : u)));
    try {
      await api.put(`/users/edit-user/${id}`, patch);
    } catch (err) {
      console.error("Failed to update user:", err);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...revertPatch } : u)));
    } finally {
      setBusyId(null);
    }
  };

  const toggleVerify = (id) => {
    const user = users.find((u) => u._id === id);
    if (!user) return;
    patchUser(id, { isVerified: !user.isVerified }, { isVerified: user.isVerified });
  };

  // NOTE: this assumes your User schema has a `status` field ("active" / "banned").
  // If it doesn't yet, this PUT will silently drop the field server-side (Mongoose
  // ignores unknown keys by default) and the button won't actually do anything —
  // add `status` to the schema first if banning isn't wired up yet.
  const toggleBan = (id) => {
    const user = users.find((u) => u._id === id);
    if (!user) return;
    const nextStatus = user.status === "banned" ? "active" : "banned";
    patchUser(id, { status: nextStatus }, { status: user.status });
  };

  const promote = (id) => {
    const user = users.find((u) => u._id === id);
    if (!user || user.role !== "end-user") return; // matches original behavior: only promotes end-users
    patchUser(id, { role: "admin" }, { role: user.role });
  };

  const deleteUser = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await api.delete(`/users/delete-user/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

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

      {loading && <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading users…</p>}
      {!loading && error && <p className="admin-panel-count"><FiAlertCircle /> {error}</p>}

      {!loading && !error && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr>
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
                    <td>
                      <div className="admin-row-actions">
                        <button
                          title="Toggle verify"
                          disabled={busyId === u._id}
                          onClick={() => toggleVerify(u._id)}
                        >
                          <FiCheckCircle />
                        </button>
                        <button
                          title="Ban / unban"
                          disabled={busyId === u._id}
                          onClick={() => toggleBan(u._id)}
                        >
                          <FiSlash />
                        </button>
                        <button
                          title="Promote to admin"
                          disabled={busyId === u._id || u.role !== "end-user"}
                          onClick={() => promote(u._id)}
                        >
                          <FiShield />
                        </button>
                        <button
                          title="Delete user"
                          className="admin-row-action-danger"
                          disabled={busyId === u._id}
                          onClick={() => deleteUser(u._id, u.username)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
