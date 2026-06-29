import React, { useState } from "react";
import "./dashboard.css";

// ─── tiny inline SVG icons (no extra dependency) ───────────────────────────
const Icon = {
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  BookOpen: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  DollarSign: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Award: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  TrendingDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
};

// ─── static data ────────────────────────────────────────────────────────────
const KPI_DATA = [
  {
    label: "Total students",
    value: "12,847",
    trend: "+8.4%",
    trendDir: "up",
    trendSub: "vs last month",
    icon: "Users",
    colorClass: "purple",
  },
  {
    label: "Active courses",
    value: "94",
    trend: "+12",
    trendDir: "up",
    trendSub: "this month",
    icon: "BookOpen",
    colorClass: "green",
  },
  {
    label: "Monthly revenue",
    value: "$38,240",
    trend: "+15.2%",
    trendDir: "up",
    trendSub: "vs last month",
    icon: "DollarSign",
    colorClass: "blue",
  },
  {
    label: "Completions",
    value: "3,291",
    trend: "-2.1%",
    trendDir: "down",
    trendSub: "vs last month",
    icon: "Award",
    colorClass: "amber",
  },
];

const ENROLL_DATA = [
  { day: "Mon", count: 142 },
  { day: "Tue", count: 198 },
  { day: "Wed", count: 176 },
  { day: "Thu", count: 231 },
  { day: "Fri", count: 209 },
  { day: "Sat", count: 87 },
  { day: "Sun", count: 134 },
];

const ROLE_DATA = [
  { label: "Students",    pct: 87, color: "#7c3aed" },
  { label: "Instructors", pct: 9,  color: "#16a34a" },
  { label: "Admins",      pct: 3,  color: "#d97706" },
  { label: "Super admin", pct: 1,  color: "#dc2626" },
];

const QUICK_STATS = [
  { label: "Avg session time",   value: "24 min" },
  { label: "Quiz pass rate",     value: "72%" },
  { label: "Notes created today",value: "489" },
  { label: "New signups today",  value: "134" },
  { label: "Active right now",   value: "847", live: true },
  { label: "Open support tickets", badge: { text: "12 open", type: "warning" } },
];

const USERS = [
  { name: "Sara Khan",    initials: "SK", color: "#7c3aed", role: "Student",    roleType: "purple", courses: 4,  status: "active",   joined: "Jun 28" },
  { name: "Ali Hassan",   initials: "AH", color: "#16a34a", role: "Instructor", roleType: "success",courses: 12, status: "active",   joined: "Jun 27" },
  { name: "Fatima R.",    initials: "FR", color: "#d97706", role: "Student",    roleType: "purple", courses: 2,  status: "inactive", joined: "Jun 26" },
  { name: "Omar Siddiq",  initials: "OS", color: "#dc2626", role: "Admin",      roleType: "warning",courses: 0,  status: "active",   joined: "Jun 25" },
  { name: "Ayesha B.",    initials: "AB", color: "#1d4ed8", role: "Student",    roleType: "purple", courses: 7,  status: "active",   joined: "Jun 24" },
];

const ACTIVITIES = [
  { color: "#7c3aed", text: "New course \"Advanced SQL\" submitted for review",           time: "2 min ago" },
  { color: "#16a34a", text: "Ali Hassan enrolled 23 students via bulk upload",           time: "18 min ago" },
  { color: "#d97706", text: "Quiz \"Python Basics\" flagged for high failure rate",        time: "34 min ago" },
  { color: "#dc2626", text: "User report filed against course content",                  time: "1 hr ago" },
  { color: "#1d4ed8", text: "Monthly revenue report auto-generated",                     time: "2 hr ago" },
  { color: "#16a34a", text: "System backup completed successfully",                      time: "3 hr ago" },
];

const SYSTEM_HEALTH = [
  { label: "Server uptime", value: "99.9%", pct: 99.9, color: "#16a34a" },
  { label: "CPU usage",     value: "34%",   pct: 34,   color: "#7c3aed" },
  { label: "Memory",        value: "61%",   pct: 61,   color: "#d97706" },
  { label: "Storage",       value: "47%",   pct: 47,   color: "#1d4ed8" },
  { label: "API response",  value: "18 ms", pct: null,  color: "#16a34a" },
];

const TOP_COURSES = [
  { name: "Complete Python Bootcamp",      students: 2341, rating: 4.8 },
  { name: "Web Dev with React",            students: 1987, rating: 4.7 },
  { name: "Data Science Fundamentals",     students: 1652, rating: 4.9 },
  { name: "UI/UX Design Principles",       students: 1201, rating: 4.6 },
  { name: "Machine Learning A-Z",          students: 984,  rating: 4.8 },
];

const PENDING_APPROVALS = [
  { text: "New instructor application — Zara Shah",     iconColor: "#7c3aed", iconBg: "#ede9fe", icon: "Users" },
  { text: '"Advanced React" course awaiting approval',   iconColor: "#16a34a", iconBg: "#dcfce7", icon: "BookOpen" },
  { text: "Bulk refund request (14 students)",           iconColor: "#dc2626", iconBg: "#fee2e2", icon: "AlertCircle" },
  { text: "Admin role request — Omar Raza",              iconColor: "#d97706", iconBg: "#fef3c7", icon: "Shield" },
];

const REV_CATEGORIES = [
  { label: "Programming",  pct: 42, color: "#7c3aed" },
  { label: "Design",       pct: 21, color: "#16a34a" },
  { label: "Data Science", pct: 19, color: "#1d4ed8" },
  { label: "Business",     pct: 11, color: "#d97706" },
  { label: "Other",        pct: 7,  color: "#9ca3af" },
];

// ─── Donut SVG ──────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 110, thickness = 20 }) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let cumulativePct = 0;
  const gap = 1.5; // degrees gap between segments

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circumference - (gap * circumference) / 360;
        const offset = circumference - (cumulativePct / 100) * circumference;
        cumulativePct += seg.pct;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(0, dash)} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const maxEnroll = Math.max(...ENROLL_DATA.map((d) => d.count));
  const peakIdx = ENROLL_DATA.findIndex((d) => d.count === maxEnroll);

  // donut total for center label
  const totalStudents = "12,847";

  return (
    <div className="dashboard-page">

      {/* ── Page header ── */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1>Good morning, Mateen 👋</h1>
          <p>Here's what's happening across your academy today.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn">
            <Icon.Download />
            Export
          </button>
          <button className="btn btn-primary">
            <Icon.Plus />
            Add course
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="kpi-grid">
        {KPI_DATA.map((kpi) => {
          const IconComp = Icon[kpi.icon];
          return (
            <div className="kpi-card" key={kpi.label}>
              <div className={`kpi-icon-wrap ${kpi.colorClass}`}>
                <IconComp />
              </div>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
              <div className={`kpi-trend ${kpi.trendDir}`}>
                {kpi.trendDir === "up" ? <Icon.TrendingUp /> : <Icon.TrendingDown />}
                {kpi.trend} {kpi.trendSub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mid row: bar chart + donut + quick stats ── */}
      <div className="mid-row">

        {/* Bar chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Enrollments — last 7 days</span>
          </div>
          <div className="card-body">
            <div className="bar-chart-wrap">
              <div className="bar-chart-bars">
                {ENROLL_DATA.map((d, i) => (
                  <div className="bar-col" key={d.day}>
                    <div
                      className={`bar${i === peakIdx ? " active" : ""}`}
                      style={{ height: `${Math.round((d.count / maxEnroll) * 100)}%` }}
                      title={`${d.day}: ${d.count}`}
                    />
                    <span className="bar-day">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Donut chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">User roles</span>
          </div>
          <div className="card-body">
            <div className="donut-wrap">
              <div className="donut-svg-wrap">
                <DonutChart segments={ROLE_DATA} />
                <div className="donut-center-label">
                  <span>{totalStudents.split(",")[0]}k</span>
                  <span>users</span>
                </div>
              </div>
              <div className="donut-legend">
                {ROLE_DATA.map((r) => (
                  <div className="donut-legend-item" key={r.label}>
                    <span className="donut-legend-left">
                      <span className="donut-dot" style={{ background: r.color }} />
                      {r.label}
                    </span>
                    <span className="donut-legend-val">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Quick stats</span>
          </div>
          <div className="card-body">
            <div className="stat-list">
              {QUICK_STATS.map((s) => (
                <div className="stat-row" key={s.label}>
                  <span className="stat-label">{s.label}</span>
                  {s.badge ? (
                    <span className={`badge ${s.badge.type}`}>{s.badge.text}</span>
                  ) : s.live ? (
                    <span className="stat-value live-dot">{s.value}</span>
                  ) : (
                    <span className="stat-value">{s.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row: recent users + system health ── */}
      <div className="bottom-row">

        {/* Recent users */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent users</span>
            <a className="card-link">View all</a>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Courses</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {USERS.map((u) => (
                    <tr key={u.name}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar" style={{ background: u.color }}>
                            {u.initials}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.roleType}`}>{u.role}</span>
                      </td>
                      <td>{u.courses}</td>
                      <td>
                        <span className={`badge ${u.status === "active" ? "success" : "warning"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ color: "#9ca3af" }}>{u.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System health */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">System health</span>
            <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }}>
              <Icon.RefreshCw />
              Refresh
            </button>
          </div>
          <div className="card-body">
            <div className="health-list">
              {SYSTEM_HEALTH.map((h) => (
                <div className="health-item" key={h.label}>
                  <div className="health-meta">
                    <span className="health-name">{h.label}</span>
                    <span className="health-value">{h.value}</span>
                  </div>
                  {h.pct !== null && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${h.pct}%`, background: h.color }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lower row: top courses + activity + approvals + revenue ── */}
      <div className="lower-row">

        {/* Top courses */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top courses</span>
            <a className="card-link">View all</a>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <div className="course-list">
              {TOP_COURSES.map((c, i) => (
                <div className="course-item" key={c.name}>
                  <span className="course-rank">{i + 1}</span>
                  <div className="course-info">
                    <div className="course-name">{c.name}</div>
                    <div className="course-meta">{c.students.toLocaleString()} students</div>
                  </div>
                  <div className="course-rating">
                    <Icon.Star />
                    {c.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent activity</span>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <div className="activity-list">
              {ACTIVITIES.map((a, i) => (
                <div className="activity-item" key={i}>
                  <div className="activity-dot-wrap">
                    <div className="activity-dot" style={{ background: a.color }} />
                  </div>
                  <div>
                    <div className="activity-text">{a.text}</div>
                    <div className="activity-time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending approvals + revenue by category stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Pending approvals</span>
              <span className="badge danger">4</span>
            </div>
            <div className="card-body" style={{ paddingTop: 10 }}>
              <div className="approval-list">
                {PENDING_APPROVALS.map((p, i) => {
                  const IconComp = Icon[p.icon];
                  return (
                    <div className="approval-item" key={i}>
                      <div className="approval-icon" style={{ background: p.iconBg, color: p.iconColor }}>
                        <IconComp />
                      </div>
                      <div className="approval-body">
                        <div className="approval-text">{p.text}</div>
                        <div className="approval-actions">
                          <button className="btn btn-primary btn-sm">Approve</button>
                          <button className="btn btn-sm">Review</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Revenue by category</span>
            </div>
            <div className="card-body">
              <div className="rev-list">
                {REV_CATEGORIES.map((r) => (
                  <div className="rev-item" key={r.label}>
                    <div className="rev-meta">
                      <span className="rev-label">{r.label}</span>
                      <span className="rev-pct">{r.pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}