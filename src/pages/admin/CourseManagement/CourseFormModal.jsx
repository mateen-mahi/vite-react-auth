import { useState } from "react";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  price: "",
  duration: "",
  instructor: "",
  level: "Beginner",
  color: "#2563eb",
  emoji: "📘",
};

const SAMPLE_JSON = `[
  {
    "title": "Intro to Node.js",
    "description": "Learn backend fundamentals",
    "category": "Web Development",
    "price": 49,
    "duration": 6,
    "instructor": "64f...instructorId",
    "level": "Beginner",
    "color": "#2563eb",
    "emoji": "🚀"
  }
]`;

// Add supports BOTH a single course and a pasted JSON array, submitted to
// the exact same POST /courses/ endpoint — the backend detects
// Array.isArray(req.body) and branches internally, so no separate bulk
// endpoint or separate bulk modal is needed.
const CourseFormModal = ({ mode, course, onClose, onSuccess }) => {
  const isEdit = mode === "edit";

  const [entryMode, setEntryMode] = useState("single"); // "single" | "bulk"
  const [form, setForm] = useState({
    title: course?.title || "",
    description: course?.description || "",
    category: course?.category || "",
    price: course?.price ?? "",
    duration: course?.duration ?? "",
    instructor: course?.instructor?._id || course?.instructor || "",
    level: course?.level || "Beginner",
    color: course?.color || "#2563eb",
    emoji: course?.emoji || "📘",
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
    if (!form.category.trim()) e.category = "Category is required";
    if (form.price === "" || Number(form.price) < 0) e.price = "Valid price is required";
    if (form.duration === "" || Number(form.duration) < 0) e.duration = "Valid duration is required";
    if (!form.instructor.trim()) e.instructor = "Instructor ID is required";
    if (!form.level) e.level = "Level is required";
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
        await api.put(`/courses/${course._id}`, {
          title: form.title,
          description: form.description,
          category: form.category,
          price: Number(form.price),
          duration: Number(form.duration),
          instructor: form.instructor,
          level: form.level,
          color: form.color,
          emoji: form.emoji,
        });
        showToast("Course updated successfully", "success");
        onSuccess();
        return;
      }

      // ---- Add flow: single or bulk, same endpoint ----
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
          setErrors({ bulk: "JSON must be a non-empty array of course objects." });
          setSubmitting(false);
          return;
        }
        const res = await api.post("/courses", parsed);
        showToast(res.data.message || `${parsed.length} course(s) created successfully`, "success");
        onSuccess();
        return;
      }

      if (!validateSingle()) {
        setSubmitting(false);
        return;
      }
      const res = await api.post("/courses", {
        title: form.title,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        duration: Number(form.duration),
        instructor: form.instructor,
        level: form.level,
        color: form.color,
        emoji: form.emoji,
      });
      showToast(res.data.message || "Course created successfully", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Course" : "Add Course"}
      onClose={onClose}
      width={620}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Course"}
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
            Single Course
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
                Category<span className="required">*</span>
              </label>
              <input className="field-input" value={form.category} onChange={(e) => update("category", e.target.value)} />
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>
            <div className="field-group">
              <label className="field-label">
                Price ($)<span className="required">*</span>
              </label>
              <input
                className="field-input"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">
                Duration (hours)<span className="required">*</span>
              </label>
              <input
                className="field-input"
                type="number"
                min="0"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
              />
              {errors.duration && <span className="field-error">{errors.duration}</span>}
              <span className="field-hint">Schema stores this as a plain number — confirm the unit (hours/minutes) matches your frontend display elsewhere.</span>
            </div>
            <div className="field-group">
              <label className="field-label">
                Level<span className="required">*</span>
              </label>
              <select className="field-select" value={form.level} onChange={(e) => update("level", e.target.value)}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">
              Instructor ID<span className="required">*</span>
            </label>
            <input
              className="field-input"
              placeholder="Instructor's user ID"
              value={form.instructor}
              onChange={(e) => update("instructor", e.target.value)}
            />
            {errors.instructor && <span className="field-error">{errors.instructor}</span>}
            <span className="field-hint">Paste the instructor's user ID (found on the Users page).</span>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Color</label>
              <input
                className="field-input"
                type="color"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                style={{ height: 42, padding: 4, cursor: "pointer" }}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Emoji</label>
              <input className="field-input" value={form.emoji} onChange={(e) => update("emoji", e.target.value)} />
            </div>
          </div>
        </>
      )}

      {!isEdit && entryMode === "bulk" && (
        <div className="field-group">
          <label className="field-label">Paste a JSON array of courses</label>
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

export default CourseFormModal;
