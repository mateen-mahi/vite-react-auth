import { useState } from "react";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

const LectureFormModal = ({ mode, lecture, courses, quizzes, onClose, onSuccess }) => {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    title: lecture?.title || "",
    description: lecture?.description || "",
    videoId: lecture?.videoId || "",
    duration: lecture?.duration ?? "",
    course: lecture?.course?._id || lecture?.course || "",
    quizId: lecture?.quizId?._id || lecture?.quizId || "",
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
    if (!form.videoId.trim()) e.videoId = "Video ID is required";
    if (form.duration === "" || Number(form.duration) < 0) e.duration = "Valid duration is required";
    if (!form.course) e.course = "Course is required";
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
        videoId: form.videoId,
        duration: Number(form.duration),
        course: form.course,
        quizId: form.quizId || null,
      };

      if (isEdit) {
        await api.put(`/lectures/${lecture._id}`, payload);
        showToast("Lecture updated successfully", "success");
      } else {
        await api.post("/lectures/", payload);
        showToast("Lecture created successfully", "success");
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
      title={isEdit ? "Edit Lecture" : "Add New Lecture"}
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
            Duration (seconds)<span className="required">*</span>
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

      <div className="field-group">
        <label className="field-label">Quiz (optional)</label>
        <select className="field-select" value={form.quizId} onChange={(e) => update("quizId", e.target.value)}>
          <option value="">No quiz</option>
          {quizzes.map((q) => (
            <option key={q._id} value={q._id}>
              {q.title}
            </option>
          ))}
        </select>
      </div>
    </Modal>
  );
};

export default LectureFormModal;
