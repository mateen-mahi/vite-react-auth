import { useState } from "react";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

const PasswordModal = ({ user, onClose }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim() || password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/users/update-password/${user._id}`, { password });
      showToast("Password updated successfully", "success");
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update password", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Update Password — ${user.username}`}
      onClose={onClose}
      width={420}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </>
      }
    >
      <div className="field-group">
        <label className="field-label">
          New Password<span className="required">*</span>
        </label>
        <input
          className="field-input"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Enter new password"
        />
      </div>
      <div className="field-group">
        <label className="field-label">
          Confirm Password<span className="required">*</span>
        </label>
        <input
          className="field-input"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          placeholder="Re-enter new password"
        />
      </div>
      {error && <span className="field-error">{error}</span>}
    </Modal>
  );
};

export default PasswordModal;
