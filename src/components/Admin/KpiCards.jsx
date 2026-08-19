// src/components/admin/KpiCards.jsx
import {
  FiUsers, FiCheckCircle, FiBookOpen, FiAward,
  FiDollarSign, FiAlertCircle, FiActivity, FiWifi, FiRefreshCw, FiTrendingUp, FiTrendingDown,
} from "react-icons/fi";

// Renders a signed "+12%" / "-4%" badge, or nothing for metrics with no
// meaningful comparison period (change === null).
function TrendBadge({ change }) {
  if (change === null || change === undefined) return null;
  const isUp = change.startsWith("+");
  const isFlat = change === "0%";
  return (
    <span className={`admin-kpi-trend ${isFlat ? "flat" : isUp ? "up" : "down"}`}>
      {!isFlat && (isUp ? <FiTrendingUp /> : <FiTrendingDown />)}
      {change}
    </span>
  );
}

export default function KpiCards({ stats, loading, onlineAdmins }) {
  if (loading || !stats) {
    return (
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card admin-kpi-card-loading">
          <FiRefreshCw className="cp-spin" /> Loading stats…
        </div>
      </div>
    );
  }

  const { users, courses, revenue, complaints, certificates, engagement } = stats;

  const cards = [
    {
      label: "Total Users",
      value: users.total.toLocaleString(),
      sub: `${users.verified} verified`,
      change: users.change,
      icon: FiUsers,
      color: "#2563eb",
    },
    {
      label: "Total Revenue",
      value: `$${revenue.total.toLocaleString()}`,
      sub: `$${revenue.thisWeek.toLocaleString()} this week`,
      change: revenue.change,
      icon: FiDollarSign,
      color: "#059669",
    },
    {
      label: "Active Courses",
      value: courses.total.toLocaleString(),
      sub: `${courses.featured} featured`,
      change: courses.change,
      icon: FiBookOpen,
      color: "#7c3aed",
    },
    {
      label: "Completion Rate",
      value: `${engagement.progress.completionRate}%`,
      sub: `${engagement.progress.avgProgress}% avg. progress`,
      change: null,
      icon: FiCheckCircle,
      color: "#0891b2",
    },
    {
      label: "Pending Complaints",
      value: complaints.pending.toLocaleString(),
      sub: complaints.avgResolutionHours > 0 ? `~${complaints.avgResolutionHours}h to resolve` : "No resolved yet",
      change: null,
      icon: FiAlertCircle,
      color: "#ef4444",
    },
    {
      label: "Certificates Issued",
      value: certificates.total.toLocaleString(),
      sub: `${certificates.issuedThisWeek} this week`,
      change: certificates.change,
      icon: FiAward,
      color: "#d97706",
    },
    {
      label: "DAU / WAU / MAU",
      value: `${engagement.dau} / ${engagement.wau} / ${engagement.mau}`,
      sub: "active users",
      change: null,
      icon: FiActivity,
      color: "#2563eb",
    },
    {
      label: "Admins Online",
      value: onlineAdmins,
      sub: "watching this dashboard",
      change: null,
      icon: FiWifi,
      color: "#16a34a",
      live: true,
    },
  ];

  return (
    <div className="admin-kpi-grid">
      {cards.map((c) => (
        <div key={c.label} className="admin-kpi-card">
          <div className="admin-kpi-card-top">
            <div className="admin-kpi-icon" style={{ background: c.color + "14", color: c.color }}>
              <c.icon />
            </div>
            <TrendBadge change={c.change} />
          </div>
          <p className="admin-kpi-value">
            {c.value}
            {c.live && <span className="admin-live-dot" />}
          </p>
          <p className="admin-kpi-label">{c.label}</p>
          {c.sub && <p className="admin-kpi-sub">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}
