import { FiAlertTriangle } from "react-icons/fi";
import Modal from "./Modal";
import "./adminShared/ConfirmDialog.css";

/**
 * Generic confirmation dialog for delete / destructive actions.
 *
 * Props:
 *  - title: string
 *  - message: string | node
 *  - confirmLabel: string (default "Delete")
 *  - danger: bool (default true) — styles confirm button red vs blue
 *  - loading: bool — disables buttons + shows "Working..." label
 *  - onConfirm, onClose: fn
 */
const ConfirmDialog = ({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal
      title={title}
      onClose={onClose}
      width={420}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-body">
        <div className={`confirm-icon ${danger ? "danger" : ""}`}>
          <FiAlertTriangle />
        </div>
        <p>{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
