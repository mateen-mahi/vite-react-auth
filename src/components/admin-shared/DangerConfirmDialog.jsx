import { useState } from "react";
import { FiAlertOctagon } from "react-icons/fi";
import Modal from "./Modal";
import "./css/DangerConfirmDialog.css";

/**
 * Type-to-confirm dialog for irreversible, wide-blast-radius actions
 * (e.g. "delete ALL users"). The confirm button stays disabled until
 * the typed text exactly matches `confirmPhrase`.
 *
 * Props:
 *  - title, message: string
 *  - confirmPhrase: string — what the admin must type (e.g. "DELETE ALL USERS")
 *  - loading: bool
 *  - onConfirm, onClose: fn
 */
const DangerConfirmDialog = ({
  title,
  message,
  confirmPhrase,
  loading,
  onConfirm,
  onClose,
}) => {
  const [typed, setTyped] = useState("");
  const isMatch = typed.trim() === confirmPhrase;

  return (
    <Modal
      title={title}
      onClose={onClose}
      width={460}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={!isMatch || loading}
          >
            {loading ? "Deleting…" : "Permanently Delete"}
          </button>
        </>
      }
    >
      <div className="danger-confirm-body">
        <div className="danger-confirm-icon">
          <FiAlertOctagon />
        </div>
        <p className="danger-confirm-message">{message}</p>

        <label className="field-label" style={{ marginBottom: 6, display: "block" }}>
          Type <strong>{confirmPhrase}</strong> to confirm
        </label>
        <input
          className="field-input danger-confirm-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmPhrase}
          autoComplete="off"
          autoFocus
        />
      </div>
    </Modal>
  );
};

export default DangerConfirmDialog;
