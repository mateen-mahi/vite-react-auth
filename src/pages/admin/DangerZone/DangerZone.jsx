import { useEffect, useState, useCallback } from "react";
import {
  FiUsers,
  FiBookOpen,
  FiMessageSquare,
  FiPlayCircle,
  FiHelpCircle,
  FiAward,
  FiFileText,
  FiAlertTriangle,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../../services/api";
import DangerConfirmDialog from "../../../components/admin-shared/DangerConfirmDialog.jsx";
import ToastContainer from "../../../components/admin-shared/ToastContainer.jsx";
import { showToast } from "../../../components/admin-shared/toast.js";
import "./DangerZone.css";

// A large-enough page size to mean "everything" for the resources that
// don't have a dedicated clear-all endpoint — every list endpoint is now
// paginated (some default to as few as 10), so a plain `api.get(endpoint)`
// with no params only returns one page, not the full collection. Passing
// a high `limit` is the correct way to opt into "give me everything" per
// the pagination reference.
const FETCH_ALL_LIMIT = 10000;

// ---------------------------------------------------------------
// Resource registry, updated for the new paginated list endpoints.
//
// - `listEndpoint` is used ONLY to read the real total count, via
//   `?limit=1` (cheap — we just need the `totalKey` field off the
//   response, not the records themselves).
// - `totalKey` is which field on that response holds the true total —
//   these differ per endpoint (see the pagination reference), so getting
//   this right matters: `.data.length` would have silently reported the
//   page size instead of the real count once these endpoints started
//   paginating.
// - `clearAllEndpoint` is used directly when the backend has a dedicated
//   bulk-delete route (unaffected by the pagination changes).
// - Without a `clearAllEndpoint`, `deleteOne(id)` + a `limit=<FETCH_ALL_LIMIT>`
//   fetch are used to pull every record and delete them one by one —
//   same pattern used on each individual management page's "Delete all".
// ---------------------------------------------------------------
const RESOURCES = [
  {
    key: "users",
    label: "Users",
    icon: <FiUsers />,
    description: "Every registered user account, including admins and instructors.",
    listEndpoint: "/admin/users",
    totalKey: "totalUsers",
    clearAllEndpoint: "/users/clear-all-users",
    confirmPhrase: "DELETE ALL USERS",
  },
  {
    key: "courses",
    label: "Courses",
    icon: <FiBookOpen />,
    description: "Every course, along with its association to lectures and quizzes.",
    listEndpoint: "/courses",
    totalKey: "total",
    deleteOne: (id) => `/courses/${id}`,
    confirmPhrase: "DELETE ALL COURSES",
  },
  {
    key: "lectures",
    label: "Lectures",
    icon: <FiPlayCircle />,
    description: "Every lecture across every course.",
    listEndpoint: "/lectures",
    totalKey: "total",
    deleteOne: (id) => `/lectures/${id}`,
    confirmPhrase: "DELETE ALL LECTURES",
  },
  {
    key: "quizzes",
    label: "Quizzes",
    icon: <FiHelpCircle />,
    description: "Every quiz and all of its questions.",
    listEndpoint: "/quizzes",
    totalKey: "total",
    deleteOne: (id) => `/quizzes/${id}`,
    confirmPhrase: "DELETE ALL QUIZZES",
  },
  {
    key: "books",
    label: "Books",
    icon: <FiFileText />,
    description: "Every uploaded book/document and its file in storage.",
    listEndpoint: "/books",
    totalKey: "total",
    deleteOne: (id) => `/books/${id}`,
    confirmPhrase: "DELETE ALL BOOKS",
  },
  {
    key: "certificates",
    label: "Certificates",
    icon: <FiAward />,
    description: "Every issued certificate and its generated file.",
    // Was "/certificates" — the admin-scoped, paginated route is
    // /admin/certificates per the pagination reference.
    listEndpoint: "/admin/certificates",
    totalKey: "totalCertificates",
    deleteOne: (id) => `/certificates/${id}`,
    confirmPhrase: "DELETE ALL CERTIFICATES",
  },
  {
    key: "complaints",
    label: "Complaints",
    icon: <FiMessageSquare />,
    description: "Every user complaint, including replies and status history.",
    // Was "/complaints/all-complaints" — the admin-scoped, paginated
    // route is /admin/complaints.
    listEndpoint: "/admin/complaints",
    totalKey: "totalComplaints",
    clearAllEndpoint: "/complaints/clear-all-complaints",
    confirmPhrase: "DELETE ALL COMPLAINTS",
  },
];

// For resources without a clearAllEndpoint, this pulls the full
// collection (unfiltered, unpaginated in effect) so every record can be
// deleted one by one.
const extractArray = (data) =>
  data?.data || data?.users || data?.courses || data?.lectures ||
  data?.quizzes || data?.books || data?.certificates || data?.complaints || [];

const DangerZone = () => {
  const [counts, setCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [target, setTarget] = useState(null); // resource object currently being confirmed
  const [deleting, setDeleting] = useState(false);

  const fetchCounts = useCallback(async () => {
    setCountsLoading(true);
    const next = {};
    await Promise.all(
      RESOURCES.map(async (r) => {
        try {
          // limit=1 — we only need the response's total field, not the
          // record(s) themselves, so this stays cheap regardless of how
          // large the collection actually is.
          const res = await api.get(r.listEndpoint, { params: { limit: 1 } });
          next[r.key] = res.data[r.totalKey] ?? 0;
        } catch {
          next[r.key] = null; // null = couldn't load count, not necessarily zero
        }
      })
    );
    setCounts(next);
    setCountsLoading(false);
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleDeleteAll = async (resource) => {
    setDeleting(true);
    try {
      if (resource.clearAllEndpoint) {
        await api.delete(resource.clearAllEndpoint);
      } else {
        const res = await api.get(resource.listEndpoint, { params: { limit: FETCH_ALL_LIMIT } });
        const items = extractArray(res.data);
        await Promise.all(items.map((item) => api.delete(resource.deleteOne(item._id))));
      }
      showToast(`All ${resource.label.toLowerCase()} deleted`, "success");
      setTarget(null);
      fetchCounts();
    } catch (err) {
      showToast(
        err.response?.data?.message || `Failed to delete all ${resource.label.toLowerCase()}`,
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Danger Zone</h1>
          <p className="admin-page-subtitle">
            Bulk-delete entire resource collections. Every action here is permanent
            and cannot be undone.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchCounts} disabled={countsLoading}>
          <FiRefreshCw className={countsLoading ? "cp-spin" : ""} /> Refresh counts
        </button>
      </div>

      <div className="danger-banner">
        <FiAlertTriangle />
        <span>
          These actions permanently delete data with no recovery option. Double-check
          you're on the correct environment (production vs. staging) before proceeding.
        </span>
      </div>

      <div className="danger-grid">
        {RESOURCES.map((resource) => (
          <div className="danger-card" key={resource.key}>
            <div className="danger-card-top">
              <div className="danger-card-icon">{resource.icon}</div>
              <div>
                <h3 className="danger-card-title">{resource.label}</h3>
                <p className="danger-card-desc">{resource.description}</p>
              </div>
            </div>

            <div className="danger-card-footer">
              <span className="danger-card-count">
                {countsLoading ? (
                  "…"
                ) : counts[resource.key] === null ? (
                  "Count unavailable"
                ) : (
                  <>
                    <strong>{counts[resource.key]}</strong> record
                    {counts[resource.key] === 1 ? "" : "s"}
                  </>
                )}
              </span>
              <button
                className="btn btn-danger-outline btn-sm"
                onClick={() => setTarget(resource)}
                disabled={countsLoading || !counts[resource.key]}
              >
                <FiTrash2 /> Delete All
              </button>
            </div>
          </div>
        ))}
      </div>

      {target && (
        <DangerConfirmDialog
          title={`Delete all ${target.label.toLowerCase()}?`}
          message={`You are about to permanently delete ${
            counts[target.key] ?? "all"
          } ${target.label.toLowerCase()}. This action cannot be undone.`}
          confirmPhrase={target.confirmPhrase}
          loading={deleting}
          onConfirm={() => handleDeleteAll(target)}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
};

export default DangerZone;
