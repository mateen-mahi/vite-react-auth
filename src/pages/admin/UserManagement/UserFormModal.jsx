import { useState } from "react";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal";
import { showToast } from "../../../components/admin-shared/toast.js";

const SAMPLE_JSON = `[
  {
    "username": "jane_doe",
    "email": "jane@example.com",
    "password": "pass1234",
    "gender": "female",
    "role": "student"
  }
]`;

// Add supports single OR a pasted JSON array, both going to the exact same
// POST /users/add-user — the backend detects Array.isArray(req.body) and
// handles either shape, so there's no separate bulk endpoint or modal.
const UserFormModal = ({ mode, user, onClose, onSuccess }) => {
  const isEdit = mode === "edit";

  const [entryMode, setEntryMode] = useState("single");
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    gender: user?.gender || "",
    role: user?.role || "user",
    isVerified: user?.isVerified ?? false,
  });
  const [bulkJson, setBulkJson] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Matches the real schema: username/email/password required, gender is
  // NOT required, password minlength is 4 (not 6).
  const validateSingle = () => {
    const e = {};
    if (!form.username.trim() || form.username.trim().length < 4)
      e.username = "Username is required (min 4 characters)";
    if (!form.email.trim()) e.email = "Email is required";
    if (!isEdit && (!form.password.trim() || form.password.length < 4))
      e.password = "Password is required (min 4 characters)";
    if (!form.role) e.role = "Role is required";
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
        await api.put(`/users/edit-user/${user._id}`, {
          username: form.username,
          email: form.email,
          gender: form.gender || undefined,
          role: form.role,
          isVerified: form.isVerified,
        });
        showToast("User updated successfully", "success");
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
          setErrors({ bulk: "JSON must be a non-empty array of user objects." });
          setSubmitting(false);
          return;
        }
        const res = await api.post("/users/add-user", parsed);
        showToast(res.data.message || `${parsed.length} user(s) added successfully`, "success");
        onSuccess();
        return;
      }

      if (!validateSingle()) {
        setSubmitting(false);
        return;
      }
      const res = await api.post("/users/add-user", {
        username: form.username,
        email: form.email,
        password: form.password,
        gender: form.gender || undefined,
        role: form.role,
      });
      showToast(res.data.message || "User created successfully", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit User" : "Add User"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
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
            Single User
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
              Username<span className="required">*</span>
            </label>
            <input
              className="field-input"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <div className="field-group">
            <label className="field-label">
              Email<span className="required">*</span>
            </label>
            <input
              className="field-input"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {!isEdit && (
            <div className="field-group">
              <label className="field-label">
                Password<span className="required">*</span>
              </label>
              <input
                className="field-input"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
          )}

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Gender</label>
              <select className="field-select" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <span className="field-hint">Optional — not required by the schema.</span>
            </div>

            <div className="field-group">
              <label className="field-label">
                Role<span className="required">*</span>
              </label>
              <select className="field-select" value={form.role} onChange={(e) => update("role", e.target.value)}>
                <option value="user">User</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </div>
          </div>

          {isEdit && (
            <div className="field-group">
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form.isVerified}
                  onChange={(e) => update("isVerified", e.target.checked)}
                />
                Email verified
              </label>
            </div>
          )}
        </>
      )}

      {!isEdit && entryMode === "bulk" && (
        <div className="field-group">
          <label className="field-label">Paste a JSON array of users</label>
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

export default UserFormModal;
