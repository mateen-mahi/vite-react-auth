import { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import Modal from "../Modal";
import "./adminShared/BulkJsonUploadModal.css";

/**
 * Generic "paste JSON array" bulk upload modal.
 *
 * Props:
 *  - title: string
 *  - sampleJson: string — shown as a placeholder/example
 *  - requiredFields: string[] — used only for a friendly hint, not strict validation
 *  - onSubmit: async (parsedArray) => void   (parent handles the actual API calls)
 *  - onClose: fn
 */
const BulkJsonUploadModal = ({
  title = "Bulk upload via JSON",
  sampleJson,
  requiredFields = [],
  onSubmit,
  onClose,
}) => {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [parsedCount, setParsedCount] = useState(null);

  const handleChange = (val) => {
    setRaw(val);
    setError("");
    setParsedCount(null);

    if (!val.trim()) return;

    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        setError("JSON must be an array of objects, e.g. [ { ... }, { ... } ]");
        return;
      }
      if (parsed.length === 0) {
        setError("Array is empty — add at least one object.");
        return;
      }
      setParsedCount(parsed.length);
    } catch {
      setError("Invalid JSON — check for missing commas, quotes, or brackets.");
    }
  };

  const handleSubmit = async () => {
    if (!raw.trim()) {
      setError("Paste a JSON array first.");
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setError("JSON must be a non-empty array of objects.");
        return;
      }
    } catch {
      setError("Invalid JSON — check for missing commas, quotes, or brackets.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      width={620}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !raw.trim()}
          >
            <FiUploadCloud />
            {submitting ? "Uploading…" : "Upload"}
          </button>
        </>
      }
    >
      {requiredFields.length > 0 && (
        <p className="bulk-hint">
          Each object needs: <strong>{requiredFields.join(", ")}</strong>
        </p>
      )}
      <textarea
        className="field-textarea bulk-textarea"
        placeholder={sampleJson || '[\n  { ... },\n  { ... }\n]'}
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
      />
      {error && <p className="field-error bulk-error">{error}</p>}
      {parsedCount !== null && !error && (
        <p className="bulk-preview">
          ✓ Looks valid — {parsedCount} item{parsedCount > 1 ? "s" : ""} ready to upload.
        </p>
      )}
    </Modal>
  );
};

export default BulkJsonUploadModal;
