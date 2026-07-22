import { useState } from "react";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal/Modal";
import { showToast } from "../../../components/admin-shared/Toast/toast";

const UserFormModal = ({ mode, user, onClose, onSuccess }) => {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    gender: user?.gender || "male",
    role: user?.role || "student",
    isVerified: user?.isVerified ?? false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!isEdit && !form.password.trim()) e.password = "Password is required";
    if (!form.gender) e.gender = "Gender is required";
    if (!form.role) e.role = "Role is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/users/edit-user/${user._id}`, {
          username: form.username,
          email: form.email,
          gender: form.gender,
          role: form.role,
          isVerified: form.isVerified,
        });
        showToast("User updated successfully", "success");
      } else {
        await api.post("/users/add-user", {
          username: form.username,
          email: form.email,
          password: form.password,
          gender: form.gender,
          role: form.role,
        });
        showToast("User created successfully", "success");
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
      title={isEdit ? "Edit User" : "Add New User"}
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
          <label className="field-label">
            Gender<span className="required">*</span>
          </label>
          <select
            className="field-select"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">
            Role<span className="required">*</span>
          </label>
          <select
            className="field-select"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
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
    </Modal>
  );
};

export default UserFormModal;
