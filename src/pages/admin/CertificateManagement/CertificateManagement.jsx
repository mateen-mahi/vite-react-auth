import { useEffect, useMemo, useState, useCallback } from "react";
import { FiTrash2, FiEye, FiAward } from "react-icons/fi";
import api from "../../../services/api";
import DataTable from "../../../components/admin-shared/DataTable/DataTable";
import SearchBar from "../../../components/admin-shared/SearchBar/SearchBar";
import Pagination from "../../../components/admin-shared/Pagination/Pagination";
import ConfirmDialog from "../../../components/admin-shared/ConfirmDialog/ConfirmDialog";
import ToastContainer from "../../../components/admin-shared/Toast/ToastContainer";
import { showToast } from "../../../components/admin-shared/Toast/toast";
import CertificateDetailsModal from "./CertificateDetailsModal";
import "./CertificateManagement.css";

const PAGE_SIZE = 10;

const STATUS_CLASS = {
  active: "status-success",
  revoked: "status-danger",
};

const CertificateManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [viewCertificate, setViewCertificate] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/certificates");
      setCertificates(res.data.data || res.data.certificates || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load certificates", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const filtered = useMemo(() => {
    if (!search.trim()) return certificates;
    const q = search.trim().toLowerCase();
    return certificates.filter(
      (c) =>
        c.certificateNumber?.toLowerCase().includes(q) ||
        c.studentId?.username?.toLowerCase().includes(q) ||
        c.studentId?.email?.toLowerCase().includes(q) ||
        c.courseId?.title?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q)
    );
  }, [certificates, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const paginated = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const runConfirmedDelete = async () => {
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
    {
      key: "course",
      label: "Course",
      render: (row) => row.courseId?.title || "—",
    },
    {
      key: "issuedAt",
      label: "Issued",
      render: (row) => (row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : "—"),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`status-badge ${STATUS_CLASS[row.status] || "status-info"}`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <ToastContainer />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Certificate Management</h1>
          <p className="admin-page-subtitle">View and manage issued certificates.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by certificate ID, student, course, or status…"
        />
      </div>

      <div className="admin-card">
        <DataTable
          columns={columns}
          data={paginated}
          loading={loading}
          emptyProps={{
            icon: <FiAward />,
            title: search ? "No matching certificates" : "No certificates yet",
            subtitle: search
              ? "Try a different search term."
              : "Issued certificates will show up here.",
          }}
          actions={(row) => (
            <div className="dt-row-actions">
              <button className="btn-icon" title="View details" onClick={() => setViewCertificate(row)}>
                <FiEye />
              </button>
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
        <Pagination page={pageSafe} pages={pages} total={filtered.length} onPageChange={setPage} />
      </div>

      {viewCertificate && (
        <CertificateDetailsModal
          certificate={viewCertificate}
          onClose={() => setViewCertificate(null)}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Delete this certificate?"
          message={`This permanently deletes certificate "${confirmTarget.certificateNumber}" and its file. This cannot be undone.`}
          loading={actionLoading}
          onConfirm={runConfirmedDelete}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
};

export default CertificateManagement;
