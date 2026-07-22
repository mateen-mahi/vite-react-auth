import { useState } from "react";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

const ComplaintReplyModal = ({ complaint, onClose, onSuccess }) => {
  const [status, setStatus] = useState(complaint.status || "pending");
  const [answer, setAnswer] = useState(complaint.answer || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/complaints/update-status/${complaint._id}`, {
        status,
        answer,
      });
      showToast("Complaint updated successfully", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update complaint", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Reply to Complaint"
      onClose={onClose}
      width={540}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Save Reply"}
          </button>
        </>
      }
    >
      <div className="complaint-context">
        <div className="detail-row">
          <span className="detail-label">From</span>
          <span className="detail-value">
            {complaint.user?.username} ({complaint.user?.email})
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Subject</span>
          <span className="detail-value">{complaint.subject}</span>
        </div>
        <div className="complaint-original">{complaint.description}</div>
      </div>

      <div className="field-group">
        <label className="field-label">Status</label>
        <select className="field-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">Answer</label>
        <textarea
          className="field-textarea"
          rows={5}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write your reply to the user…"
        />
      </div>
    </Modal>
  );
};

export default ComplaintReplyModal;
