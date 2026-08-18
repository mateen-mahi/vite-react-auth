import { useState } from "react";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal";
import { showToast } from "../../../components/admin-shared/toast.js";

const SAMPLE_JSON = `[
  {
    "title": "Intro to Variables",
    "description": "Basics of JS variables",
    "videoId": "abc123",
    "duration": 10,
    "course": "64f...courseId"
  }
]`;

// Add supports single OR a pasted JSON array, both going to POST /lectures/ —
// the backend detects Array.isArray(req.body) and handles either shape.
// NOTE: your real Lecture schema has no quizId field, so it's intentionally
// not part of this form (an earlier draft of this form had one — removed).
const LectureFormModal = ({ mode, lecture, courses, onClose, onSuccess }) => {
  const isEdit = mode === "edit";

  const [entryMode, setEntryMode] = useState("single");
  const [form, setForm] = useState({
    title: lecture?.title || "",
    description: lecture?.description || "",
    videoId: lecture?.videoId || "",
    duration: lecture?.duration ?? "",
    course: lecture?.course?._id || lecture?.course || "",
  });
  const [bulkJson, setBulkJson] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateSingle = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.videoId.trim()) e.videoId = "Video ID is required";
    if (form.duration === "" || Number(form.duration) < 0) e.duration = "Valid duration is required";
    if (!form.course) e.course = "Course is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (isEdit) {
        if (!validateSingle()) {
          setSubmitting(false);
          return;
        }
        await api.put(`/lectures/${lecture._id}`, {
          title: form.title,
          description: form.description,
          videoId: form.videoId,
          duration: Number(form.duration),
          course: form.course,
        });
        showToast("Lecture updated successfully", "success");
        onSuccess();
        return;
      }

      if (entryMode === "bulk") {
        if (!bulkJson.trim()) {
          setErrors({ bulk: "Paste a JSON array first." });
          setSubmitting(false);
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(bulkJson);
        } catch {
          setErrors({ bulk: "Invalid JSON — check for missing commas, quotes, or brackets." });
          setSubmitting(false);
          return;
        }
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setErrors({ bulk: "JSON must be a non-empty array of lecture objects." });
          setSubmitting(false);
          return;
        }
        const res = await api.post("/lectures", parsed);
        showToast(res.data.message || `${parsed.length} lecture(s) created successfully`, "success");
        onSuccess();
        return;
      }

      if (!validateSingle()) {
        setSubmitting(false);
        return;
      }
      const res = await api.post("/lectures", {
        title: form.title,
        description: form.description,
        videoId: form.videoId,
        duration: Number(form.duration),
        course: form.course,
      });
      showToast(res.data.message || "Lecture created successfully", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Lecture" : "Add Lecture"}
      onClose={onClose}
      width={560}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Lecture"}
          </button>
        </>
      }
    >
      {!isEdit && (
        <div className="entry-mode-tabs">
          <button
            type="button"
            className={`entry-mode-tab ${entryMode === "single" ? "active" : ""}`}
            onClick={() => setEntryMode("single")}
          >
            Single Lecture
          </button>
          <button
            type="button"
            className={`entry-mode-tab ${entryMode === "bulk" ? "active" : ""}`}
            onClick={() => setEntryMode("bulk")}
          >
            Bulk (Paste JSON)
          </button>
        </div>
      )}

      {(isEdit || entryMode === "single") && (
        <>
          <div className="field-group">
            <label className="field-label">
              Title<span className="required">*</span>
            </label>
            <input className="field-input" value={form.title} onChange={(e) => update("title", e.target.value)} />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="field-group">
            <label className="field-label">
              Description<span className="required">*</span>
            </label>
            <textarea
              className="field-textarea"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">
                Video ID<span className="required">*</span>
              </label>
              <input className="field-input" value={form.videoId} onChange={(e) => update("videoId", e.target.value)} />
              {errors.videoId && <span className="field-error">{errors.videoId}</span>}
            </div>
            <div className="field-group">
              <label className="field-label">
                Duration (minutes)<span className="required">*</span>
              </label>
              <input
                className="field-input"
                type="number"
                min="0"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
              />
              {errors.duration && <span className="field-error">{errors.duration}</span>}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">
              Course<span className="required">*</span>
            </label>
            <select className="field-select" value={form.course} onChange={(e) => update("course", e.target.value)}>
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            {errors.course && <span className="field-error">{errors.course}</span>}
          </div>
        </>
      )}

      {!isEdit && entryMode === "bulk" && (
        <div className="field-group">
          <label className="field-label">Paste a JSON array of lectures</label>
          <textarea
            className="field-textarea bulk-textarea"
            placeholder={SAMPLE_JSON}
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            spellCheck={false}
          />
          {errors.bulk && <span className="field-error">{errors.bulk}</span>}
        </div>
      )}
    </Modal>
  );
};

export default LectureFormModal;
