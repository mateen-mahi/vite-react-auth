import { useEffect, useMemo, useState } from "react";
import { FiUploadCloud, FiFile, FiSearch } from "react-icons/fi";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

const ACCEPT_ATTR = ".pdf,.doc,.docx,.png,.jpg,.jpeg";

const IssueCertificateModal = ({ courses, onClose, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [grade, setGrade] = useState("");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/users/all-users")
      .then((res) => setUsers(res.data.users || res.data.data || []))
      .catch(() => {});
  }, []);

  const selectedStudent = users.find((u) => u._id === studentId);

  const studentMatches = useMemo(() => {
    if (!studentSearch.trim()) return [];
    const q = studentSearch.trim().toLowerCase();
    return users
      .filter((u) => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [users, studentSearch]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!studentId) e.studentId = "Select a student.";
    if (!courseId) e.courseId = "Select a course.";
    if (!file) e.file = "Please attach the certificate file.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("courseId", courseId);
      if (instructorId) formData.append("instructorId", instructorId);
      if (grade.trim()) formData.append("grade", grade.trim());
      formData.append("certificate", file); // field name must match your multer config

      await api.post("/certificates/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Certificate issued successfully", "success");
      onSuccess();
    } catch (err) {
      // Backend enforces one certificate per student per course (unique index) —
      // surface that message clearly rather than a generic failure.
      showToast(err.response?.data?.message || "Failed to issue certificate", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Issue Certificate"
      onClose={onClose}
      width={560}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Issuing…" : "Issue Certificate"}
          </button>
        </>
      }
    >
      <div className="field-group">
        <label className="field-label">
          Student<span className="required">*</span>
        </label>
        {selectedStudent ? (
          <div className="cert-picked-user">
            <span>
              {selectedStudent.username} <span className="cert-picked-email">({selectedStudent.email})</span>
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setStudentId("");
                setStudentSearch("");
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <div className="search-bar" style={{ maxWidth: "none" }}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by username or email…"
              />
            </div>
            {studentMatches.length > 0 && (
              <div className="cert-user-suggestions">
                {studentMatches.map((u) => (
                  <button
                    type="button"
                    key={u._id}
                    className="cert-user-suggestion-row"
                    onClick={() => {
                      setStudentId(u._id);
                      setStudentSearch("");
                    }}
                  >
                    <span>{u.username}</span>
                    <span className="cert-picked-email">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {errors.studentId && <span className="field-error">{errors.studentId}</span>}
      </div>

      <div className="field-group">
        <label className="field-label">
          Course<span className="required">*</span>
        </label>
        <select className="field-select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Select a course…</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
        {errors.courseId && <span className="field-error">{errors.courseId}</span>}
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Instructor (optional)</label>
          <select className="field-select" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
            <option value="">None</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Grade (optional)</label>
          <input className="field-input" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. A, Distinction" />
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">
          Certificate File<span className="required">*</span>
        </label>
        <label className="book-file-drop">
          <FiUploadCloud />
          <span>{file ? file.name : "Click to attach the certificate document/image"}</span>
          <input type="file" accept={ACCEPT_ATTR} onChange={handleFileChange} hidden />
        </label>
        {file && (
          <span className="book-file-picked">
            <FiFile /> {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </span>
        )}
        {errors.file && <span className="field-error">{errors.file}</span>}
      </div>
    </Modal>
  );
};

export default IssueCertificateModal;
