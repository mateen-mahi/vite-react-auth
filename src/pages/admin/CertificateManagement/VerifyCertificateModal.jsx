import { useState } from "react";
import { FiSearch, FiCheckCircle, FiXCircle } from "react-icons/fi";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import Spinner from "../../../components/admin-shared/Spinner/Spinner";

const VerifyCertificateModal = ({ onClose }) => {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { found: bool, data? }
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      setError("Enter a certificate number.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await api.get(`/certificates/verify/${certificateNumber.trim()}`);
      setResult({ found: true, data: res.data.data || res.data });
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ found: false });
      } else {
        setError(err.response?.data?.message || "Verification failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Verify a Certificate" onClose={onClose} width={480}>
      <div className="field-group">
        <label className="field-label">Certificate Number</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="field-input"
            value={certificateNumber}
            onChange={(e) => {
              setCertificateNumber(e.target.value);
              setResult(null);
              setError("");
            }}
            placeholder="CERT-XXXXXXXXXX-XXXXXXXX"
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          <button className="btn btn-primary" onClick={handleVerify} disabled={loading}>
            <FiSearch /> Verify
          </button>
        </div>
        {error && <span className="field-error">{error}</span>}
      </div>

      {loading && <Spinner label="Checking…" />}

      {!loading && result?.found === false && (
        <div className="cert-verify-result invalid">
          <FiXCircle />
          <div>
            <p className="cert-verify-title">Not found or invalid</p>
            <p className="cert-verify-sub">No active certificate matches that number.</p>
          </div>
        </div>
      )}

      {!loading && result?.found && (
        <div className="cert-verify-result valid">
          <FiCheckCircle />
          <div className="detail-list" style={{ width: "100%" }}>
            <div className="detail-row">
              <span className="detail-label">Student</span>
              <span className="detail-value">{result.data.student?.username || result.data.studentId?.username || "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Course</span>
              <span className="detail-value">{result.data.course?.title || result.data.courseId?.title || "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Issued</span>
              <span className="detail-value">
                {result.data.issuedAt ? new Date(result.data.issuedAt).toLocaleDateString() : "—"}
              </span>
            </div>
            {result.data.grade && (
              <div className="detail-row">
                <span className="detail-label">Grade</span>
                <span className="detail-value">{result.data.grade}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default VerifyCertificateModal;
