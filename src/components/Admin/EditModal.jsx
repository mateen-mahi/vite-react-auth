// src/components/admin/EditModal.jsx
import { FiX } from "react-icons/fi";

export default function EditModal({ title, onClose, onSave, saving, children, wide }) {
  return (
    <div className="admin-modal-overlay" onMouseDown={onClose}>
      <div
        className={`admin-modal ${wide ? "admin-modal-wide" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="admin-btn admin-btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
