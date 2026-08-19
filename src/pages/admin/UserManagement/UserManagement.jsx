import { useState } from "react";
import { FiPlus, FiTrash2, FiEye, FiEdit2, FiKey, FiUsers } from "react-icons/fi";
import api from "../../../services/api";
import useListQuery from "../../../components/admin-shared/useListQuery";
import DataTable from "../../../components/admin-shared/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar";
import FilterBar from "../../../components/admin-shared/FilterBar";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast.js";
import UserFormModal from "./UserFormModal";
import UserDetailsModal from "./UserDetailsModal";
import PasswordModal from "./PasswordModal";
import "./UserManagement.css";

const ROLE_STATUS = {
  "super-admin": "status-danger",
  admin: "status-danger",
  instructor: "status-info",
  student: "status-success",
  user: "status-info",
};

// GET /api/admin/users — sortable: username, email, role, gender,
// isVerified, createdAt, updatedAt. Default sort createdAt desc.
// Filters: role, gender, isVerified, search.
const FILTER_CONFIG = [
  {
    key: "role",
    label: "Role",
    options: [
      { value: "student", label: "Student" },
      { value: "instructor", label: "Instructor" },
      { value: "admin", label: "Admin" },
      { value: "super-admin", label: "Super Admin" },
    ],
  },
  {
    key: "gender",
    label: "Gender",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "isVerified",
    label: "Verified",
    options: [
      { value: "true", label: "Verified" },
      { value: "false", label: "Pending" },
    ],
  },
];

const initials = (name = "") =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const UserManagement = () => {
  const list = useListQuery({
    endpoint: "/admin/users",
    defaultSortBy: "createdAt",
    defaultOrder: "desc",
    limit: 10,
    initialFilters: { role: "", gender: "", isVerified: "" },
    parseResponse: (data) => ({
      items: data.users,
      total: data.totalUsers,
      pages: data.totalPages,
    }),
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [confirmState, setConfirmState] = useState(null); // { type: "single"|"multi"|"all", target }
  const [actionLoading, setActionLoading] = useState(false);

  // ---- selection (per current page only) ----
  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allOnPageSelected =
    list.items.length > 0 && list.items.every((u) => selectedIds.has(u._id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        list.items.forEach((u) => next.delete(u._id));
      } else {
        list.items.forEach((u) => next.add(u._id));
      }
      return next;
    });
  };

  // ---- delete flows ----
  const handleDeleteSingle = (user) => setConfirmState({ type: "single", target: user });
  const handleDeleteSelected = () => setConfirmState({ type: "multi", target: null });
  const handleDeleteAll = () => setConfirmState({ type: "all", target: null });

  const runConfirmedDelete = async () => {
    setActionLoading(true);
    try {
      if (confirmState.type === "single") {
        await api.delete(`/users/delete-user/${confirmState.target._id}`);
        showToast("User deleted", "success");
      } else if (confirmState.type === "multi") {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => api.delete(`/users/delete-user/${id}`)));
        showToast(`${ids.length} user(s) deleted`, "success");
        setSelectedIds(new Set());
      } else if (confirmState.type === "all") {
        await api.delete("/users/clear-all-users");
        showToast("All users deleted", "success");
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
      key: "username",
      label: "User",
      sortable: true,
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
      sortable: true,
      render: (row) => (
        <span className={`status-badge ${ROLE_STATUS[row.role] || "status-info"}`}>{row.role}</span>
      ),
    },
    { key: "gender", label: "Gender", sortable: true },
    {
      key: "isVerified",
      label: "Verified",
      sortable: true,
      render: (row) => (
        <span className={`status-badge ${row.isVerified ? "status-success" : "status-warning"}`}>
          {row.isVerified ? "Verified" : "Pending"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"),
    },
  ];

  const hasActiveQuery = !!list.search || Object.values(list.filters).some((v) => v);

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
          value={list.search}
          onChange={list.setSearch}
          placeholder="Search by username or email…"
        />
        <FilterBar
          filters={list.filters}
          onChange={list.setFilter}
          onReset={list.resetFilters}
          config={FILTER_CONFIG}
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
            icon: <FiUsers />,
            title: hasActiveQuery ? "No matching users" : "No users yet",
            subtitle: hasActiveQuery
              ? "Try a different search term or filter."
              : "Add your first user to get started.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="View details" onClick={() => setViewUser(row)}>
                <FiEye />
              </button>
              <button className="btn-icon" title="Edit user" onClick={() => setEditUser(row)}>
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
          page={list.page}
          pages={list.pages}
          total={list.total}
          limit={list.limit}
          onPageChange={list.setPage}
          onLimitChange={list.setLimit}
        />
      </div>

      {showAddModal && (
        <UserFormModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            list.refetch();
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
            list.refetch();
          }}
        />
      )}

      {viewUser && <UserDetailsModal user={viewUser} onClose={() => setViewUser(null)} />}

      {passwordUser && <PasswordModal user={passwordUser} onClose={() => setPasswordUser(null)} />}

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
