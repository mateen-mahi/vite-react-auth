import { useState, useRef } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  FiUser, FiMail, FiShield, FiCalendar,
  FiCheckCircle, FiAlertCircle, FiClock,
  FiMonitor, FiMapPin, FiLock, FiEye,
  FiEyeOff, FiSave, FiRefreshCw, FiCamera,
} from "react-icons/fi";
import AvatarCropModal from "./AvatarCropModal";
import "../styles/profile.css";




const DUMMY_USER = {
  username: useAuth().user?.username || "Usman",
  imageUrl : "https://example.com/avatar.jpg",
  email: "mateen@academy.com",
  role: "Administrator",
  gender: "Male",
  createdAt: "2024-03-15T10:00:00Z",
  isVerified: true,
};

const DUMMY_HISTORY = [
  { loginTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),        ipAddress: "119.152.44.21", location: "Lahore, Pakistan" },
  { loginTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),    ipAddress: "119.152.44.21", location: "Lahore, Pakistan" },
  { loginTime: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),   ipAddress: "39.51.12.100",  location: "Islamabad, Pakistan" },
  { loginTime: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),   ipAddress: "119.152.44.21", location: "Lahore, Pakistan" },
  { loginTime: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),   ipAddress: "103.99.4.200",  location: "Karachi, Pakistan" },
];


const AVATAR_UPLOAD_URL = `/edit-user/${user._id}`; 

async function uploadAvatarToBackend(fileOrBlob, filename = "avatar.jpg") {
  const formData = new FormData();
  // Blobs (from the crop step) have no filename of their own, so pass one explicitly
  formData.append("avatar", fileOrBlob, filename); // field name must match your multer.single("avatar")

  const res = await api.post(AVATAR_UPLOAD_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data; // TODO: adjust to whatever shape your backend returns
}

// ─── Helpers ───────────────────────────────────────────────
const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const formatDateTime = (d) => new Date(d).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const TABS = [
  { id: "info",     label: "Account Info",    icon: FiUser },
  { id: "history",  label: "Login History",   icon: FiClock },
  { id: "password", label: "Change Password", icon: FiLock },
];

export default function Profile() {

  const { user } = useAuth();
  


  const [activeTab, setActiveTab] = useState("info");

  // ── Avatar / upload state ────────────────────────────────
  const [avatarUrl, setAvatarUrl]   = useState(user.imageUrl);
  const [imgError, setImgError]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // ── Crop modal state ──────────────────────────────────────
  const [cropImageSrc, setCropImageSrc] = useState(null); // object URL of the raw selected file
  const [showCropModal, setShowCropModal] = useState(false);

  const showImage = Boolean(avatarUrl) && !imgError;

  const handleAvatarClick = () => fileInputRef.current?.click();

  // Step 1: user picks a file → just open the cropper, no upload yet
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image must be smaller than 8MB.");
      return;
    }

    setUploadError(null);
    setCropImageSrc(URL.createObjectURL(file));
    setShowCropModal(true);
  };

  const closeCropModal = () => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setShowCropModal(false);
  };

  // Step 2: user confirms the crop → we get back a cropped Blob → upload that
  const handleCropConfirm = async (croppedBlob) => {
    setShowCropModal(false);

    const previewUrl = URL.createObjectURL(croppedBlob);
    setImgError(false);
    setAvatarUrl(previewUrl);
    setUploading(true);

    try {
      const data = await uploadAvatarToBackend(croppedBlob);
      // TODO: replace `data.imageUrl` with whatever key your Express
      // route sends back after Multer + Cloudinary finish the upload.
      setAvatarUrl(data.imageUrl);
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
      setAvatarUrl(user.imageUrl); // revert to last known good avatar
    } finally {
      setUploading(false);
      URL.revokeObjectURL(previewUrl);
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  // ── Change password state ────────────────────────────────
  const [pwForm, setPwForm]     = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow]     = useState({ current: false, next: false, confirm: false });
  const [pwStatus, setPwStatus] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const toggleShow = (f) => setPwShow((p) => ({ ...p, [f]: !p[f] }));

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPwStatus(null);
    if (pwForm.next !== pwForm.confirm) { setPwStatus({ type: "error", msg: "New passwords don't match." }); return; }
    if (pwForm.next.length < 4)         { setPwStatus({ type: "error", msg: "Password must be at least 4 characters." }); return; }
    setPwLoading(true);
    setTimeout(() => {
      setPwLoading(false);
      setPwStatus({ type: "success", msg: "Password changed successfully." });
      setPwForm({ current: "", next: "", confirm: "" });
    }, 1000);
  };

  return (
    <div className="prof-page">

      {/* ── Hero ── */}
      <div className="prof-hero">
        <div className="prof-hero-bg" />
        <div className="prof-hero-body">
          <div className="prof-avatar-ring">
            <button
              type="button"
              className="prof-avatar-clickable"
              onClick={handleAvatarClick}
              disabled={uploading}
              title="Change profile picture"
            >
              {showImage ? (
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className="prof-avatar-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="prof-avatar">{user.username.charAt(0)}</div>
              )}

              <span className="prof-avatar-edit-badge">
                {uploading ? <FiRefreshCw className="prof-spin" /> : <FiCamera />}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="prof-avatar-input-hidden"
              onChange={handleFileChange}
            />
          </div>

          {showCropModal && (
            <AvatarCropModal
              imageSrc={cropImageSrc}
              onCancel={closeCropModal}
              onConfirm={handleCropConfirm}
            />
          )}

          {uploadError && (
            <p className="prof-avatar-error"><FiAlertCircle /> {uploadError}</p>
          )}

          <div className="prof-hero-name-row">
            <h1 className="prof-name">{user.username}</h1>
            {user.isVerified
              ? <span className="prof-badge verified"><FiCheckCircle /> Verified</span>
              : <span className="prof-badge unverified"><FiAlertCircle /> Unverified</span>
            }
          </div>
          <p className="prof-email">{user.email}</p>
          <p className="prof-role-pill">{user.role}</p>

          <div className="prof-stats">
            <div className="prof-stat">
              <FiCalendar className="prof-stat-icon" />
              <div>
                <p className="prof-stat-label">Joined</p>
                <p className="prof-stat-value">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            <div className="prof-stat-divider" />
            <div className="prof-stat">
              <FiShield className="prof-stat-icon" />
              <div>
                <p className="prof-stat-label">Role</p>
                <p className="prof-stat-value">{user.role}</p>
              </div>
            </div>
            <div className="prof-stat-divider" />
            <div className="prof-stat">
              <FiCheckCircle className="prof-stat-icon" />
              <div>
                <p className="prof-stat-label">Status</p>
                <p className={`prof-stat-value ${user.isVerified ? "clr-green" : "clr-red"}`}>
                  {user.isVerified ? "Active" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="prof-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`prof-tab ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}>
            <Icon /><span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Panel ── */}
      <div className="prof-panel">

        {/* Account Info */}
        {activeTab === "info" && (
          <div className="prof-info-grid">
            <InfoRow icon={FiUser}        label="Username"       value={user.username} />
            <InfoRow icon={FiMail}        label="Email"          value={user.email} />
            <InfoRow icon={FiShield}      label="Role"           value={user.role} />
            <InfoRow icon={FiUser}        label="Gender"         value={user.gender} />
            <InfoRow icon={FiCalendar}    label="Joined"         value={formatDate(user.createdAt)} />
            <InfoRow icon={FiCheckCircle} label="Email Verified" value={user.isVerified ? "Yes" : "No"} valueClass={user.isVerified ? "clr-green" : "clr-red"} />
          </div>
        )}

        {/* Login History */}
        {activeTab === "history" && (
          <div className="prof-history">
            {DUMMY_HISTORY.map((entry, i) => (
              <div key={i} className={`prof-history-item ${i === 0 ? "latest" : ""}`}>
                <div className="prof-history-dot" />
                <div className="prof-history-body">
                  <div className="prof-history-top">
                    <span className="prof-history-time"><FiClock /> {formatDateTime(entry.loginTime)}</span>
                    {i === 0 && <span className="prof-latest-tag">Latest</span>}
                  </div>
                  <div className="prof-history-meta">
                    <span><FiMonitor /> {entry.ipAddress}</span>
                    <span><FiMapPin /> {entry.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Change Password */}
        {activeTab === "password" && (
          <form className="prof-pw-form" onSubmit={handlePasswordChange}>
            <p className="prof-pw-note">Choose a strong password — at least 4 characters.</p>

            {pwStatus && (
              <div className={`prof-pw-status ${pwStatus.type}`}>
                {pwStatus.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
                {pwStatus.msg}
              </div>
            )}

            {[
              { key: "current", label: "Current password" },
              { key: "next",    label: "New password" },
              { key: "confirm", label: "Confirm new password" },
            ].map(({ key, label }) => (
              <div key={key} className="prof-pw-field">
                <label className="prof-pw-label">{label}</label>
                <div className="prof-pw-input-wrap">
                  <input
                    type={pwShow[key] ? "text" : "password"}
                    className="prof-pw-input"
                    value={pwForm[key]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                    required
                    placeholder="••••••••"
                  />
                  <button type="button" className="prof-pw-eye" onClick={() => toggleShow(key)}>
                    {pwShow[key] ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            ))}

            <button type="submit" className="prof-pw-submit" disabled={pwLoading}>
              {pwLoading ? <><FiRefreshCw className="prof-spin" /> Saving…</> : <><FiSave /> Save Password</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="prof-info-row">
      <div className="prof-info-icon-wrap"><Icon /></div>
      <div className="prof-info-text">
        <p className="prof-info-label">{label}</p>
        <p className={`prof-info-value ${valueClass}`}>{value || "—"}</p>
      </div>
    </div>
  );
}
