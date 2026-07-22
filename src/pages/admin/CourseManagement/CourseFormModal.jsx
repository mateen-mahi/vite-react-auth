import { useState } from "react";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

const CourseFormModal = ({ mode, course, onClose, onSuccess }) => {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    title: course?.title || "",
    description: course?.description || "",
    category: course?.category || "",
    price: course?.price ?? "",
    duration: course?.duration || "",
    instructor: course?.instructor?._id || course?.instructor || "",
    level: course?.level || "beginner",
    color: course?.color || "#2563eb",
    emoji: course?.emoji || "📘",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.category.trim()) e.category = "Category is required";
    if (form.price === "" || Number(form.price) < 0) e.price = "Valid price is required";
    if (!form.duration.trim()) e.duration = "Duration is required";
    if (!form.instructor.trim()) e.instructor = "Instructor ID is required";
    if (!form.level) e.level = "Level is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        duration: form.duration,
        instructor: form.instructor,
        level: form.level,
        color: form.color,
        emoji: form.emoji,
      };

      if (isEdit) {
        await api.put(`/courses/${course._id}`, payload);
        showToast("Course updated successfully", "success");
      } else {
        await api.post("/courses/", payload);
        showToast("Course created successfully", "success");
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
      title={isEdit ? "Edit Course" : "Add New Course"}
      onClose={onClose}
      width={560}
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
            Duration<span className="required">*</span>
          </label>
          <input
            className="field-input"
            placeholder="e.g. 6 weeks"
            value={form.duration}
            onChange={(e) => update("duration", e.target.value)}
          />
          {errors.duration && <span className="field-error">{errors.duration}</span>}
        </div>
        <div className="field-group">
          <label className="field-label">
            Level<span className="required">*</span>
          </label>
          <select className="field-select" value={form.level} onChange={(e) => update("level", e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
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
    </Modal>
  );
};

export default CourseFormModal;
