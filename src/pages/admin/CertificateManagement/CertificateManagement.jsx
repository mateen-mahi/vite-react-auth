import { useEffect, useState, useCallback } from "react";
import { FiTrash2, FiEye, FiAward, FiPlus, FiSlash, FiSearch } from "react-icons/fi";
import api from "../../../services/api";
import DataTable from "../../../components/admin-shared/DataTable";
import Pagination from "../../../components/admin-shared/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/ToastContainer";
import { showToast } from "../../../components/admin-shared/toast";
import CertificateDetailsModal from "./CertificateDetailsModal";
import IssueCertificateModal from "./IssueCertificateModal";
import VerifyCertificateModal from "./VerifyCertificateModal";
import "./CertificateManagement.css";

const PAGE_SIZE = 10;

const STATUS_CLASS = {
  active: "status-success",
  revoked: "status-danger",
};

// Certificates use structured server-side filters (courseId, studentId,
// status) + pagination — matches getAllCertificates exactly, so this page
// doesn't do client-side filtering like the other pages.
const CertificateManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [studentIdFilter, setStudentIdFilter] = useState("");

  const [viewCertificate, setViewCertificate] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // delete target
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api
      .get("/courses")
      .then((res) => setCourses(res.data.data || []))
      .catch(() => {});
  }, []);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (courseFilter) params.courseId = courseFilter;
      if (statusFilter) params.status = statusFilter;
      if (studentIdFilter.trim()) params.studentId = studentIdFilter.trim();

      const res = await api.get("/certificates/", { params });
      setCertificates(res.data.data || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load certificates", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, courseFilter, statusFilter, studentIdFilter]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  useEffect(() => {
    setPage(1);
  }, [courseFilter, statusFilter, studentIdFilter]);

  const runDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/certificates/${confirmTarget._id}`);
      showToast("Certificate deleted", "success");
      setConfirmTarget(null);
      fetchCertificates();
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
      fetchCertificates();
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
      render: (row) => (row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : "—"),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`status-badge ${STATUS_CLASS[row.status] || "status-info"}`}>{row.status}</span>
      ),
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
        <select className="field-select cert-filter-select" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
        <select className="field-select cert-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
        <input
          className="field-input cert-filter-select"
          placeholder="Filter by student ID…"
          value={studentIdFilter}
          onChange={(e) => setStudentIdFilter(e.target.value)}
        />
      </div>

      <div className="admin-card">
        <DataTable
          columns={columns}
          data={certificates}
          loading={loading}
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
              <button
                className="btn-icon danger"
                title="Delete certificate"
                onClick={() => setConfirmTarget(row)}
              >
                <FiTrash2 />
              </button>
            </div>
          )}
        />
        <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>

      {viewCertificate && (
        <CertificateDetailsModal certificate={viewCertificate} onClose={() => setViewCertificate(null)} />
      )}

      {showIssueModal && (
        <IssueCertificateModal
          courses={courses}
          onClose={() => setShowIssueModal(false)}
          onSuccess={() => {
            setShowIssueModal(false);
            fetchCertificates();
          }}
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
