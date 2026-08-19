import { useEffect, useState } from "react";
import { FiTrash2, FiEye, FiAward, FiPlus, FiSlash, FiSearch, FiChevronUp, FiChevronDown } from "react-icons/fi";
import api from "../../../services/api";
import useListQuery from "../../../components/admin-shared/useListQuery";
import DataTable from "../../../components/admin-shared/DataTable";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast";
import CertificateDetailsModal from "./CertificateDetailsModal";
import IssueCertificateModal from "./IssueCertificateModal";
import VerifyCertificateModal from "./VerifyCertificateModal";
import "./CertificateManagement.css";

const STATUS_CLASS = {
  active: "status-success",
  revoked: "status-danger",
};

// GET /api/admin/certificates — sortable: status|grade|issuedAt|certificateNumber.
// Filters: courseId, studentId, status. (Was calling /certificates/ before
// — the reference doc documents the admin-scoped route as /admin/certificates.)
const SORT_OPTIONS = [
  { value: "issuedAt", label: "Issue Date" },
  { value: "grade", label: "Grade" },
  { value: "certificateNumber", label: "Certificate ID" },
  { value: "status", label: "Status" },
];

const CertificateManagement = () => {
  const list = useListQuery({
    endpoint: "/admin/certificates",
    defaultSortBy: "issuedAt",
    defaultOrder: "desc",
    limit: 10,
    initialFilters: { courseId: "", status: "", studentId: "" },
    parseResponse: (data) => ({
      items: data.data,
      total: data.totalCertificates,
      pages: data.totalPages,
    }),
  });

  const [courses, setCourses] = useState([]);
  useEffect(() => {
    api.get("/courses", { params: { limit: 500 } })
      .then((res) => setCourses(res.data.data || []))
      .catch(() => {});
  }, []);

  // studentId is a free-text ObjectId filter — debounce it locally rather
  // than firing a request on every keystroke.
  const [studentIdInput, setStudentIdInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => list.setFilter("studentId", studentIdInput.trim()), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentIdInput]);

  const [viewCertificate, setViewCertificate] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const runDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/certificates/${confirmTarget._id}`);
      showToast("Certificate deleted", "success");
      setConfirmTarget(null);
      list.refetch();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const runRevoke = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/certificates/${revokeTarget._id}/revoke`);
      showToast("Certificate revoked", "success");
      setRevokeTarget(null);
      list.refetch();
    } catch (err) {
      showToast(err.response?.data?.message || "Revoke failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "certificateNumber",
      label: "Certificate ID",
      sortable: true,
      render: (row) => <span className="cert-number-cell">{row.certificateNumber}</span>,
    },
    {
      key: "student",
      label: "Student",
      render: (row) => (
        <div>
          <div className="cert-student-name">{row.studentId?.username || "—"}</div>
          <div className="cert-student-email">{row.studentId?.email || "—"}</div>
        </div>
      ),
    },
    { key: "course", label: "Course", render: (row) => row.courseId?.title || "—" },
    {
      key: "issuedAt",
      label: "Issued",
      sortable: true,
      render: (row) => (row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : "—"),
    },
    { key: "grade", label: "Grade", sortable: true, render: (row) => row.grade || "—" },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => <span className={`status-badge ${STATUS_CLASS[row.status] || "status-info"}`}>{row.status}</span>,
    },
  ];

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Certificate Management</h1>
          <p className="admin-page-subtitle">Issue, verify, revoke, and manage issued certificates.</p>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-ghost" onClick={() => setShowVerifyModal(true)}>
            <FiSearch /> Verify a Certificate
          </button>
          <button className="btn btn-primary" onClick={() => setShowIssueModal(true)}>
            <FiPlus /> Issue Certificate
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <select
          className="field-select cert-filter-select"
          value={list.filters.courseId}
          onChange={(e) => list.setFilter("courseId", e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>

        <select
          className="field-select cert-filter-select"
          value={list.filters.status}
          onChange={(e) => list.setFilter("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>

        <input
          className="field-input cert-filter-select"
          placeholder="Filter by student ID…"
          value={studentIdInput}
          onChange={(e) => setStudentIdInput(e.target.value)}
        />

        <div className="admin-toolbar-spacer" style={{ display: "flex", gap: 8 }}>
          <select
            className="field-select cert-filter-select"
            value={list.sortBy}
            onChange={(e) => list.toggleSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
          </select>
          <button
            className="btn-icon"
            title={list.order === "asc" ? "Ascending" : "Descending"}
            onClick={() => list.toggleSort(list.sortBy)}
          >
            {list.order === "asc" ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>
      </div>

      <div className="admin-card">
        <DataTable
          columns={columns}
          data={list.items}
          loading={list.loading}
          sortBy={list.sortBy}
          order={list.order}
          onSort={list.toggleSort}
          emptyProps={{
            icon: <FiAward />,
            title: "No certificates found",
            subtitle: "Try adjusting the filters, or issue a new certificate.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="View details" onClick={() => setViewCertificate(row)}>
                <FiEye />
              </button>
              {row.status === "active" && (
                <button className="btn-icon" title="Revoke certificate" onClick={() => setRevokeTarget(row)}>
                  <FiSlash />
                </button>
              )}
              <button className="btn-icon danger" title="Delete certificate" onClick={() => setConfirmTarget(row)}>
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

      {viewCertificate && <CertificateDetailsModal certificate={viewCertificate} onClose={() => setViewCertificate(null)} />}

      {showIssueModal && (
        <IssueCertificateModal
          courses={courses}
          onClose={() => setShowIssueModal(false)}
          onSuccess={() => { setShowIssueModal(false); list.refetch(); }}
        />
      )}

      {showVerifyModal && <VerifyCertificateModal onClose={() => setShowVerifyModal(false)} />}

      {revokeTarget && (
        <ConfirmDialog
          title="Revoke this certificate?"
          message={`"${revokeTarget.certificateNumber}" will be marked as revoked and will no longer verify as valid. This can't be undone from this panel.`}
          confirmLabel="Revoke"
          danger={false}
          loading={actionLoading}
          onConfirm={runRevoke}
          onClose={() => setRevokeTarget(null)}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Delete this certificate?"
          message={`This permanently deletes certificate "${confirmTarget.certificateNumber}" and its file. This cannot be undone.`}
          loading={actionLoading}
          onConfirm={runDelete}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
};

export default CertificateManagement;
