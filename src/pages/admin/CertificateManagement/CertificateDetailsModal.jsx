import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal";
import Spinner from "../../../components/admin-shared/Spinner";
import { showToast } from "../../../components/admin-shared/toast.js";

const CertificateDetailsModal = ({ certificate, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/certificates/${certificate._id}`);
        if (mounted) setDetails(res.data.data || res.data.certificate || res.data);
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to load certificate", "error");
        onClose();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificate._id]);

  return (
    <Modal title="Certificate Details" onClose={onClose} width={460}>
      {loading ? (
        <Spinner label="Loading certificate…" />
      ) : (
        <div className="detail-list">
          <DetailRow label="Certificate ID" value={details.certificateNumber} />
          <DetailRow label="Student" value={details.studentId?.username} />
          <DetailRow label="Student Email" value={details.studentId?.email} />
          <DetailRow label="Course" value={details.courseId?.title} />
          <DetailRow label="Instructor" value={details.instructorId?.username || "—"} />
          <DetailRow label="Grade" value={details.grade || "—"} />
          <DetailRow label="Status" value={details.status} />
          <DetailRow
            label="Issued"
            value={details.issuedAt ? new Date(details.issuedAt).toLocaleDateString() : "—"}
          />
          {details.document?.url && (
            <div style={{ marginTop: 16 }}>
              <a
                href={details.document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: "100%" }}
              >
                <FiDownload /> View / Download Certificate
              </a>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value ?? "—"}</span>
  </div>
);

export default CertificateDetailsModal;
