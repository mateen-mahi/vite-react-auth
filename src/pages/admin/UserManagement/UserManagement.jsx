import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FiPlus,
  FiTrash2,
  FiEye,
  FiEdit2,
  FiKey,
  FiUsers,
} from "react-icons/fi";
import api from "../../../services/api";
import DataTable from "../../../components/admin-shared/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast.js";
import UserFormModal from "./UserFormModal";
import UserDetailsModal from "./UserDetailsModal";
import PasswordModal from "./PasswordModal";
import "./UserManagement.css";

const PAGE_SIZE = 10;

const ROLE_STATUS = {
  "super-admin": "status-danger",
  admin: "status-danger",
  instructor: "status-info",
  student: "status-success",
  user: "status-info",
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);

  const [confirmState, setConfirmState] = useState(null); // { type: "single"|"multi"|"all", target }
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/all-users");
      setUsers(res.data.data || res.data.users || []);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to load users",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ---- client-side search across username / email / role ----
  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const paginated = filtered.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  // ---- selection ----
  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allOnPageSelected =
    paginated.length > 0 && paginated.every((u) => selectedIds.has(u._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginated.forEach((u) => next.delete(u._id));
      } else {
        paginated.forEach((u) => next.add(u._id));
      }
      return next;
    });
  };

  // ---- delete flows ----
  const handleDeleteSingle = (user) =>
    setConfirmState({ type: "single", target: user });
  const handleDeleteSelected = () =>
    setConfirmState({ type: "multi", target: null });
  const handleDeleteAll = () => setConfirmState({ type: "all", target: null });

  const runConfirmedDelete = async () => {
    setActionLoading(true);
    try {
      if (confirmState.type === "single") {
        await api.delete(`/users/delete-user/${confirmState.target._id}`);
        showToast("User deleted", "success");
      } else if (confirmState.type === "multi") {
        const ids = Array.from(selectedIds);
        await Promise.all(
          ids.map((id) => api.delete(`/users/delete-user/${id}`))
        );
        showToast(`${ids.length} user(s) deleted`, "success");
        setSelectedIds(new Set());
      } else if (confirmState.type === "all") {
        await api.delete("/users/clear-all-users");
        showToast("All users deleted", "success");
        setSelectedIds(new Set());
      }
      setConfirmState(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const initials = (name = "") =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const columns = [
    {
      key: "username",
      label: "User",
      render: (row) => (
        <div className="user-cell">
          <div className="avatar-chip">{initials(row.username)}</div>
          <div>
            <div className="user-cell-name">{row.username}</div>
            <div className="user-cell-email">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <span className={`status-badge ${ROLE_STATUS[row.role] || "status-info"}`}>
          {row.role}
        </span>
      ),
    },
    { key: "gender", label: "Gender" },
    {
      key: "isVerified",
      label: "Verified",
      render: (row) => (
        <span
          className={`status-badge ${
            row.isVerified ? "status-success" : "status-warning"
          }`}
        >
          {row.isVerified ? "Verified" : "Pending"}
        </span>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">
            View, add, edit, and manage every user on the platform.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add User
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by username, email, or role…"
        />
        {selectedIds.size > 0 && (
          <div className="admin-toolbar-selected">
            {selectedIds.size} selected
            <button
              className="btn btn-danger-outline btn-sm"
              onClick={handleDeleteSelected}
            >
              <FiTrash2 /> Delete selected
            </button>
          </div>
        )}
        <button
          className="btn btn-danger-outline btn-sm"
          style={{ marginLeft: "auto" }}
          onClick={handleDeleteAll}
          disabled={users.length === 0}
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
            icon: <FiUsers />,
            title: search ? "No matching users" : "No users yet",
            subtitle: search
              ? "Try a different search term."
              : "Add your first user to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button
                className="btn-icon"
                title="View details"
                onClick={() => setViewUser(row)}
              >
                <FiEye />
              </button>
              <button
                className="btn-icon"
                title="Edit user"
                onClick={() => setEditUser(row)}
              >
                <FiEdit2 />
              </button>
              <button
                className="btn-icon"
                title="Update password"
                onClick={() => setPasswordUser(row)}
              >
                <FiKey />
              </button>
              <button
                className="btn-icon danger"
                title="Delete user"
                onClick={() => handleDeleteSingle(row)}
              >
                <FiTrash2 />
              </button>
            </div>
          )}
        />
        <Pagination
          page={pageSafe}
          pages={pages}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>

      {showAddModal && (
        <UserFormModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchUsers();
          }}
        />
      )}

      {editUser && (
        <UserFormModal
          mode="edit"
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            fetchUsers();
          }}
        />
      )}

      {viewUser && (
        <UserDetailsModal user={viewUser} onClose={() => setViewUser(null)} />
      )}

      {passwordUser && (
        <PasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={
            confirmState.type === "all"
              ? "Delete all users?"
              : confirmState.type === "multi"
              ? `Delete ${selectedIds.size} users?`
              : "Delete this user?"
          }
          message={
            confirmState.type === "all"
              ? "This permanently deletes every user on the platform. This cannot be undone."
              : confirmState.type === "multi"
              ? "This permanently deletes all selected users. This cannot be undone."
              : `This permanently deletes "${confirmState.target?.username}". This cannot be undone.`
          }
          loading={actionLoading}
          onConfirm={runConfirmedDelete}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;
