import { useState } from "react";
import { FiUploadCloud, FiFile } from "react-icons/fi";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

// Accepted document types — PDF preferred, but Word/Excel/PowerPoint also allowed.
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const ACCEPT_ATTR = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

// Books only ever add ONE at a time (no bulk here, per your instruction) —
// the file upload itself makes bulk awkward anyway. Editing is metadata-only
// (title/description/courseId) since there's no file-replace endpoint —
// only POST /books/ (create+upload) and PUT /books/:bookId (metadata) exist.
const BookFormModal = ({ mode, book, courses, onClose, onSuccess }) => {
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(book?.title || "");
  const [description, setDescription] = useState(book?.description || "");
  const [courseId, setCourseId] = useState(book?.courseId?._id || book?.courseId || "");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setErrors((prev) => ({ ...prev, file: "Only PDF, Word, Excel, or PowerPoint files are accepted." }));
      setFile(null);
      return;
    }
    setErrors((prev) => ({ ...prev, file: undefined }));
    setFile(f);
  };

  const validate = () => {
    const e = {};
    if (!title.trim() || title.length > 200) e.title = "Title is required (max 200 characters).";
    if (!description.trim() || description.length > 1000)
      e.description = "Description is required (max 1000 characters).";
    if (!isEdit && !file) e.file = "Please select a document to upload.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/books/${book._id}`, {
          title,
          description,
          courseId: courseId || null,
        });
        showToast("Book updated successfully", "success");
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        if (courseId) formData.append("courseId", courseId);
        formData.append("document", file); // field name must match your multer config

        await api.post("/books/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("Book uploaded successfully", "success");
      }
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Book" : "Upload Book"}
      onClose={onClose}
      width={540}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Upload"}
          </button>
        </>
      }
    >
      <div className="field-group">
        <label className="field-label">
          Title<span className="required">*</span>
        </label>
        <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="field-group">
        <label className="field-label">
          Description<span className="required">*</span>
        </label>
        <textarea
          className="field-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <div className="field-group">
        <label className="field-label">Course (optional)</label>
        <select className="field-select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Not linked to a course</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {!isEdit && (
        <div className="field-group">
          <label className="field-label">
            Document<span className="required">*</span>
          </label>
          <label className="book-file-drop">
            <FiUploadCloud />
            <span>{file ? file.name : "Click to choose a file — PDF preferred"}</span>
            <input type="file" accept={ACCEPT_ATTR} onChange={handleFileChange} hidden />
          </label>
          {file && (
            <span className="book-file-picked">
              <FiFile /> {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </span>
          )}
          {errors.file && <span className="field-error">{errors.file}</span>}
          <span className="field-hint">Accepted: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx).</span>
        </div>
      )}

      {isEdit && (
        <p className="field-hint">
          Editing here only updates title/description/course — replacing the uploaded file isn't supported by the current API. Delete and re-upload if the file itself needs to change.
        </p>
      )}
    </Modal>
  );
};

export default BookFormModal;
