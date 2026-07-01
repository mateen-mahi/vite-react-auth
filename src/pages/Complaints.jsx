import "../styles/complaint.css";
import { useState } from "react";
import {
  FiAlertCircle, FiCheckCircle, FiClock, FiPlus,
  FiX, FiSend, FiMessageSquare, FiSearch,
  FiChevronDown, FiChevronUp, FiBookOpen,
  FiMonitor, FiUser, FiDollarSign, FiMoreHorizontal,
  FiInbox,
} from "react-icons/fi";

// ─── Config ────────────────────────────────────────────────
const CATEGORIES = [
  { value: "course",    label: "Course Related",     icon: FiBookOpen,      color: "#2563eb" },
  { value: "technical", label: "Technical Issue",    icon: FiMonitor,       color: "#0891b2" },
  { value: "teacher",   label: "Teacher Complaint",  icon: FiUser,          color: "#8b5cf6" },
  { value: "fee",       label: "Fee / Payment",      icon: FiDollarSign,    color: "#d97706" },
  { value: "other",     label: "Other",              icon: FiMoreHorizontal,color: "#64748b" },
];

const PRIORITIES = ["Low", "Medium", "High"];

const STATUS_CONFIG = {
  Pending:    { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: FiClock         },
  "In Review":{ color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: FiAlertCircle   },
  Resolved:   { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: FiCheckCircle   },
};

const PRIORITY_CONFIG = {
  Low:    { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
  Medium: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  High:   { color: "#ef4444", bg: "#fff5f5", border: "#fecaca" },
};

// ─── Dummy past complaints ─────────────────────────────────
let nextId = 4;
const DUMMY_COMPLAINTS = [
  {
    id: 1,
    title: "Video not loading in React module",
    category: "technical",
    priority: "High",
    description: "Lecture 12 of the React course has been buffering for 3 days. I have tried on multiple browsers and devices. The issue persists only on this specific video.",
    status: "In Review",
    submittedAt: "Jun 25, 2026",
    updatedAt: "Jun 27, 2026",
    adminReply: "We have escalated this to the technical team. The video is being re-encoded and should be available within 24 hours. Apologies for the inconvenience.",
  },
  {
    id: 2,
    title: "Course certificate not received",
    category: "course",
    priority: "Medium",
    description: "I completed the CSS Mastery course 2 weeks ago (100% progress) but have not received my certificate yet. Please look into this.",
    status: "Pending",
    submittedAt: "Jun 28, 2026",
    updatedAt: "Jun 28, 2026",
    adminReply: null,
  },
  {
    id: 3,
    title: "Double charge on monthly subscription",
    category: "fee",
    priority: "High",
    description: "I was charged twice for the month of June. My bank statement shows two deductions of PKR 2,500 each on June 1st. Please refund the extra charge.",
    status: "Resolved",
    submittedAt: "Jun 10, 2026",
    updatedAt: "Jun 15, 2026",
    adminReply: "The duplicate charge has been confirmed and a refund of PKR 2,500 has been initiated. It will reflect in your account within 3–5 business days.",
  },
];

// ─── Helpers ───────────────────────────────────────────────
const getCategoryInfo = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[4];

const formatRelative = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// ─── Toast ─────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  return (
    <div className="cp-toast">
      <FiCheckCircle className="cp-toast-icon" />
      <span>{msg}</span>
      <button className="cp-toast-close" onClick={onClose}><FiX /></button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function Complaint() {
  const [complaints, setComplaints] = useState(DUMMY_COMPLAINTS);
  const [showForm,   setShowForm]   = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [search,     setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [toast,      setToast]      = useState(null);

  // ── Form state ───────────────────────────────────────────
  const EMPTY_FORM = { title: "", category: "", priority: "Medium", description: "" };
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // ── Validate ─────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = "Title is required.";
    if (!form.category)           e.category    = "Select a category.";
    if (!form.description.trim()) e.description = "Please describe your issue.";
    if (form.description.trim().length < 20) e.description = "Please provide more detail (at least 20 characters).";
    return e;
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    setLoading(true);
    // TODO: replace with API call → POST /api/complaints
    setTimeout(() => {
      const newComplaint = {
        id: nextId++,
        title: form.title,
        category: form.category,
        priority: form.priority,
        description: form.description,
        status: "Pending",
        submittedAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        updatedAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        adminReply: null,
      };
      setComplaints((prev) => [newComplaint, ...prev]);
      setForm(EMPTY_FORM);
      setErrors({});
      setShowForm(false);
      setLoading(false);
      setToast("Complaint submitted successfully.");
      setTimeout(() => setToast(null), 4000);
    }, 900);
  };

  // ── Filter ────────────────────────────────────────────────
  const filtered = complaints.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        getCategoryInfo(c.category).label.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Summary counts ────────────────────────────────────────
  const counts = {
    total:    complaints.length,
    pending:  complaints.filter((c) => c.status === "Pending").length,
    inReview: complaints.filter((c) => c.status === "In Review").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

  return (
    <div className="cp-page">

      {/* Toast */}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ── Page Header ── */}
      <div className="cp-header">
        <div>
          <h1 className="cp-title">My Complaints</h1>
          <p className="cp-subtitle">Submit an issue and track its resolution status.</p>
        </div>
        <button className="cp-new-btn" onClick={() => { setShowForm(true); setErrors({}); }}>
          <FiPlus /> New Complaint
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="cp-summary">
        {[
          { label: "Total",     value: counts.total,    color: "#2563eb", bg: "#eff6ff"  },
          { label: "Pending",   value: counts.pending,  color: "#d97706", bg: "#fffbeb"  },
          { label: "In Review", value: counts.inReview, color: "#2563eb", bg: "#eff6ff"  },
          { label: "Resolved",  value: counts.resolved, color: "#16a34a", bg: "#f0fdf4"  },
        ].map((s) => (
          <div key={s.label} className="cp-summary-card" style={{ "--sc": s.color, "--sb": s.bg }}>
            <span className="cp-summary-value">{s.value}</span>
            <span className="cp-summary-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── New Complaint Form ── */}
      {showForm && (
        <div className="cp-form-card">
          <div className="cp-form-header">
            <h2 className="cp-form-title"><FiMessageSquare /> New Complaint</h2>
            <button className="cp-form-close" onClick={() => setShowForm(false)}><FiX /></button>
          </div>

          <form className="cp-form" onSubmit={handleSubmit} noValidate>

            {/* Title */}
            <div className="cp-field">
              <label className="cp-label">Subject <span className="cp-required">*</span></label>
              <input
                className={`cp-input ${errors.title ? "error" : ""}`}
                placeholder="Briefly describe your issue…"
                value={form.title}
                onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setErrors((p) => ({ ...p, title: "" })); }}
              />
              {errors.title && <p className="cp-error-msg"><FiAlertCircle /> {errors.title}</p>}
            </div>

            {/* Category + Priority row */}
            <div className="cp-field-row">
              <div className="cp-field">
                <label className="cp-label">Category <span className="cp-required">*</span></label>
                <div className="cp-category-grid">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = form.category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        className={`cp-cat-btn ${active ? "active" : ""}`}
                        style={active ? { "--cc": cat.color, borderColor: cat.color, background: cat.color + "12" } : {}}
                        onClick={() => { setForm((p) => ({ ...p, category: cat.value })); setErrors((p) => ({ ...p, category: "" })); }}
                      >
                        <Icon style={active ? { color: cat.color } : {}} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && <p className="cp-error-msg"><FiAlertCircle /> {errors.category}</p>}
              </div>

              <div className="cp-field cp-field-priority">
                <label className="cp-label">Priority</label>
                <div className="cp-priority-group">
                  {PRIORITIES.map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    const active = form.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`cp-priority-btn ${active ? "active" : ""}`}
                        style={active ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border } : {}}
                        onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="cp-field">
              <label className="cp-label">Description <span className="cp-required">*</span></label>
              <textarea
                className={`cp-textarea ${errors.description ? "error" : ""}`}
                placeholder="Explain your issue in detail — include any relevant course name, error message, or date it started…"
                rows={5}
                value={form.description}
                onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); setErrors((p) => ({ ...p, description: "" })); }}
              />
              <div className="cp-textarea-footer">
                {errors.description
                  ? <p className="cp-error-msg"><FiAlertCircle /> {errors.description}</p>
                  : <span />}
                <span className={`cp-char-count ${form.description.length > 500 ? "over" : ""}`}>
                  {form.description.length} / 500
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="cp-form-actions">
              <button type="button" className="cp-btn-cancel" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}); }}>
                Cancel
              </button>
              <button type="submit" className="cp-btn-submit" disabled={loading}>
                {loading
                  ? <><span className="cp-spinner" /> Submitting…</>
                  : <><FiSend /> Submit Complaint</>
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── History ── */}
      <div className="cp-history-section">
        <div className="cp-history-toolbar">
          <h2 className="cp-history-title">Complaint History</h2>
          <div className="cp-history-controls">
            {/* Search */}
            <div className="cp-search-wrap">
              <FiSearch className="cp-search-icon" />
              <input
                className="cp-search"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Status filter */}
            <div className="cp-status-pills">
              {["All", "Pending", "In Review", "Resolved"].map((s) => (
                <button
                  key={s}
                  className={`cp-status-pill ${filterStatus === s ? "active" : ""}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="cp-empty">
            <FiInbox className="cp-empty-icon" />
            <p className="cp-empty-title">No complaints found</p>
            <p className="cp-empty-sub">
              {complaints.length === 0
                ? "You haven't submitted any complaints yet."
                : "No complaints match your current filter."}
            </p>
          </div>
        )}

        {/* Complaint cards */}
        <div className="cp-list">
          {filtered.map((c) => {
            const cat    = getCategoryInfo(c.category);
            const status = STATUS_CONFIG[c.status];
            const prio   = PRIORITY_CONFIG[c.priority];
            const CatIcon    = cat.icon;
            const StatusIcon = status.icon;
            const isExpanded = expandedId === c.id;

            return (
              <div key={c.id} className={`cp-card ${isExpanded ? "expanded" : ""}`}>

                {/* Card header — always visible */}
                <div className="cp-card-header" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                  <div className="cp-card-icon" style={{ background: cat.color + "14", color: cat.color }}>
                    <CatIcon />
                  </div>

                  <div className="cp-card-meta">
                    <div className="cp-card-title-row">
                      <p className="cp-card-title">{c.title}</p>
                      <div className="cp-card-badges">
                        <span className="cp-prio-badge" style={{ background: prio.bg, color: prio.color, border: `1px solid ${prio.border}` }}>
                          {c.priority}
                        </span>
                        <span className="cp-status-badge" style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                          <StatusIcon /> {c.status}
                        </span>
                      </div>
                    </div>
                    <div className="cp-card-info-row">
                      <span className="cp-cat-label" style={{ color: cat.color }}>
                        <CatIcon /> {cat.label}
                      </span>
                      <span className="cp-dot" />
                      <span className="cp-date">Submitted {formatRelative(c.submittedAt)}</span>
                      {c.updatedAt !== c.submittedAt && (
                        <><span className="cp-dot" /><span className="cp-date">Updated {formatRelative(c.updatedAt)}</span></>
                      )}
                    </div>
                  </div>

                  <button className="cp-expand-btn" aria-label={isExpanded ? "Collapse" : "Expand"}>
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="cp-card-body">

                    {/* Status timeline */}
                    <div className="cp-timeline">
                      {["Pending", "In Review", "Resolved"].map((step, i) => {
                        const stepCfg = STATUS_CONFIG[step];
                        const StepIcon = stepCfg.icon;
                        const statusOrder = { Pending: 0, "In Review": 1, Resolved: 2 };
                        const currentOrder = statusOrder[c.status];
                        const isDone    = statusOrder[step] <= currentOrder;
                        const isCurrent = step === c.status;
                        return (
                          <div key={step} className={`cp-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                            <div className="cp-step-icon" style={isDone ? { background: stepCfg.color, color: "#fff" } : {}}>
                              <StepIcon />
                            </div>
                            <span className="cp-step-label" style={isCurrent ? { color: stepCfg.color, fontWeight: 700 } : {}}>{step}</span>
                            {i < 2 && <div className={`cp-step-line ${statusOrder[step] < currentOrder ? "done" : ""}`} />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Description */}
                    <div className="cp-detail-block">
                      <p className="cp-detail-label">Your complaint</p>
                      <p className="cp-detail-text">{c.description}</p>
                    </div>

                    {/* Admin reply */}
                    {c.adminReply ? (
                      <div className="cp-reply-block">
                        <div className="cp-reply-header">
                          <FiCheckCircle className="cp-reply-icon" />
                          <p className="cp-reply-label">Admin Response</p>
                        </div>
                        <p className="cp-reply-text">{c.adminReply}</p>
                      </div>
                    ) : (
                      <div className="cp-no-reply">
                        <FiClock />
                        <span>Awaiting admin response — we typically respond within 24–48 hours.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}