import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  FiUser, FiMail, FiShield, FiCalendar,
  FiCheckCircle, FiAlertCircle, FiClock,
  FiMonitor, FiMapPin, FiLock, FiEye,
  FiEyeOff, FiSave, FiRefreshCw,
} from "react-icons/fi";
import "../styles/profile.css";

// ─── Helpers ───────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const getInitial = (name) => name?.charAt(0)?.toUpperCase() || "U";

// ─── Dummy login history (replace with real API response) ──
const DUMMY_HISTORY = [
  { loginTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),  ipAddress: "119.152.44.21",  location: "Lahore, Pakistan" },
  { loginTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),  ipAddress: "119.152.44.21",  location: "Lahore, Pakistan" },
  { loginTime: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(), ipAddress: "39.51.12.100",   location: "Islamabad, Pakistan" },
  { loginTime: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), ipAddress: "119.152.44.21",  location: "Lahore, Pakistan" },
  { loginTime: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), ipAddress: "103.99.4.200",   location: "Karachi, Pakistan" },
];

// ─── Tab IDs ───────────────────────────────────────────────
const TABS = [
  { id: "info",     label: "Account Info",    icon: FiUser },
  { id: "history",  label: "Login History",   icon: FiClock },
  { id: "password", label: "Change Password", icon: FiLock },
];

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("info");

  // ── Login history state ──────────────────────────────────
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // ── Change password state ────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false });
  const [pwStatus, setPwStatus] = useState(null); // { type: 'success'|'error', msg }
  const [pwLoading, setPwLoading] = useState(false);

  // ── Fetch login history when tab opens ───────────────────
  useEffect(() => {
    if (activeTab !== "history") return;
    if (history.length > 0) return; // already loaded

    setHistoryLoading(true);
    setHistoryError(null);

    // TODO: replace with real API call:
    // fetch("/api/user/login-history", { headers: { Authorization: `Bearer ${token}` } })
    //   .then(r => r.json()).then(data => setHistory(data.history))
    //   .catch(() => setHistoryError("Failed to load login history."))
    //   .finally(() => setHistoryLoading(false));

    // Simulate API delay with dummy data:
    setTimeout(() => {
      setHistory(DUMMY_HISTORY);
      setHistoryLoading(false);
    }, 800);
  }, [activeTab, history.length]);

  // ── Change password handler ──────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwStatus(null);

    if (pwForm.next !== pwForm.confirm) {
      setPwStatus({ type: "error", msg: "New passwords don't match." });
      return;
    }
    if (pwForm.next.length < 4) {
      setPwStatus({ type: "error", msg: "Password must be at least 4 characters." });
      return;
    }

    setPwLoading(true);

    // TODO: replace with real API call:
    // await fetch("/api/user/change-password", { method: "POST", body: JSON.stringify(...) })

    setTimeout(() => {
      setPwLoading(false);
      setPwStatus({ type: "success", msg: "Password changed successfully." });
      setPwForm({ current: "", next: "", confirm: "" });
    }, 1000);
  };

  const toggleShow = (field) =>
    setPwShow((prev) => ({ ...prev, [field]: !prev[field] }));

  // ── Derived ──────────────────────────────────────────────
  const initial = getInitial(user?.username);
  const joinedDate = formatDate(user?.createdAt);
  const isVerified = user?.isVerified;

  return (
    <div className="prof-page">

      {/* ── Hero Card ── */}
      <div className="prof-hero">
        <div className="prof-hero-bg" />
        <div className="prof-hero-body">
          <div className="prof-avatar-ring">
            <div className="prof-avatar">{initial}</div>
          </div>
          <div className="prof-hero-info">
            <div className="prof-hero-name-row">
              <h1 className="prof-name">{user?.username || "User"}</h1>
              {isVerified
                ? <span className="prof-badge verified"><FiCheckCircle /> Verified</span>
                : <span className="prof-badge unverified"><FiAlertCircle /> Unverified</span>
              }
            </div>
            <p className="prof-email">{user?.email || "—"}</p>
            <p className="prof-role-pill">{user?.role || "user"}</p>
          </div>

          {/* Stats row */}
          <div className="prof-stats">
            <div className="prof-stat">
              <FiCalendar className="prof-stat-icon" />
              <div>
                <p className="prof-stat-label">Joined</p>
                <p className="prof-stat-value">{joinedDate}</p>
              </div>
            </div>
            <div className="prof-stat-divider" />
            <div className="prof-stat">
              <FiShield className="prof-stat-icon" />
              <div>
                <p className="prof-stat-label">Role</p>
                <p className="prof-stat-value">{user?.role || "—"}</p>
              </div>
            </div>
            <div className="prof-stat-divider" />
            <div className="prof-stat">
              <FiCheckCircle className="prof-stat-icon" />
              <div>
                <p className="prof-stat-label">Status</p>
                <p className={`prof-stat-value ${isVerified ? "clr-green" : "clr-red"}`}>
                  {isVerified ? "Active" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="prof-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`prof-tab ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Panels ── */}
      <div className="prof-panel">

        {/* ══ ACCOUNT INFO ══ */}
        {activeTab === "info" && (
          <div className="prof-info-grid">
            <InfoRow icon={FiUser}     label="Username"  value={user?.username} />
            <InfoRow icon={FiMail}     label="Email"     value={user?.email} />
            <InfoRow icon={FiShield}   label="Role"      value={user?.role} />
            <InfoRow icon={FiUser}     label="Gender"    value={user?.gender || "Not set"} />
            <InfoRow icon={FiCalendar} label="Joined"    value={joinedDate} />
            <InfoRow
              icon={FiCheckCircle}
              label="Email verified"
              value={isVerified ? "Yes" : "No"}
              valueClass={isVerified ? "clr-green" : "clr-red"}
            />
          </div>
        )}

        {/* ══ LOGIN HISTORY ══ */}
        {activeTab === "history" && (
          <div className="prof-history">
            {historyLoading && (
              <div className="prof-loading">
                <FiRefreshCw className="prof-spin" />
                <span>Loading history…</span>
              </div>
            )}

            {historyError && (
              <div className="prof-error">
                <FiAlertCircle /> {historyError}
              </div>
            )}

            {!historyLoading && !historyError && history.length === 0 && (
              <p className="prof-empty">No login history found.</p>
            )}

            {!historyLoading && history.map((entry, i) => (
              <div key={i} className={`prof-history-item ${i === 0 ? "latest" : ""}`}>
                <div className="prof-history-dot" />
                <div className="prof-history-body">
                  <div className="prof-history-top">
                    <span className="prof-history-time">
                      <FiClock /> {formatDateTime(entry.loginTime)}
                    </span>
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

        {/* ══ CHANGE PASSWORD ══ */}
        {activeTab === "password" && (
          <form className="prof-pw-form" onSubmit={handlePasswordChange}>
            <p className="prof-pw-note">
              Choose a strong password. It must be at least 4 characters long.
            </p>

            {pwStatus && (
              <div className={`prof-pw-status ${pwStatus.type}`}>
                {pwStatus.type === "success"
                  ? <FiCheckCircle />
                  : <FiAlertCircle />
                }
                {pwStatus.msg}
              </div>
            )}

            <PwField
              label="Current password"
              value={pwForm.current}
              show={pwShow.current}
              onChange={(v) => setPwForm((p) => ({ ...p, current: v }))}
              onToggle={() => toggleShow("current")}
            />
            <PwField
              label="New password"
              value={pwForm.next}
              show={pwShow.next}
              onChange={(v) => setPwForm((p) => ({ ...p, next: v }))}
              onToggle={() => toggleShow("next")}
            />
            <PwField
              label="Confirm new password"
              value={pwForm.confirm}
              show={pwShow.confirm}
              onChange={(v) => setPwForm((p) => ({ ...p, confirm: v }))}
              onToggle={() => toggleShow("confirm")}
            />

            <button
              type="submit"
              className="prof-pw-submit"
              disabled={pwLoading}
            >
              {pwLoading
                ? <><FiRefreshCw className="prof-spin" /> Saving…</>
                : <><FiSave /> Save Password</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Small reusable sub-components ────────────────────────

function InfoRow({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="prof-info-row">
      <div className="prof-info-icon-wrap">
        <Icon />
      </div>
      <div className="prof-info-text">
        <p className="prof-info-label">{label}</p>
        <p className={`prof-info-value ${valueClass}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

function PwField({ label, value, show, onChange, onToggle }) {
  return (
    <div className="prof-pw-field">
      <label className="prof-pw-label">{label}</label>
      <div className="prof-pw-input-wrap">
        <input
          type={show ? "text" : "password"}
          className="prof-pw-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder="••••••••"
        />
        <button
          type="button"
          className="prof-pw-eye"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
}