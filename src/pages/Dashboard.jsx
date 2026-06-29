import React from "react";
import {
  HiUsers,
  HiBookOpen,
  HiCurrencyDollar,
  HiAcademicCap,
  HiTrendingUp,
  HiTrendingDown,
  HiPlus,
  HiDownload,
  HiStar,
  HiRefresh,
  HiShieldCheck,
  HiExclamationCircle,
  HiCheckCircle,
} from "react-icons/hi";
import "../styles/dashboard.css";

// ─── Static data ─────────────────────────────────────────────────────────────

const KPI_DATA = [
  {
    label: "Total students",
    value: "12,847",
    trend: "+8.4%",
    trendDir: "up",
    trendSub: "vs last month",
    Icon: HiUsers,
    colorClass: "purple",
  },
  {
    label: "Active courses",
    value: "94",
    trend: "+12",
    trendDir: "up",
    trendSub: "this month",
    Icon: HiBookOpen,
    colorClass: "green",
  },
  {
    label: "Monthly revenue",
    value: "$38,240",
    trend: "+15.2%",
    trendDir: "up",
    trendSub: "vs last month",
    Icon: HiCurrencyDollar,
    colorClass: "blue",
  },
  {
    label: "Completions",
    value: "3,291",
    trend: "-2.1%",
    trendDir: "down",
    trendSub: "vs last month",
    Icon: HiAcademicCap,
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
  { label: "Avg session time",    value: "24 min" },
  { label: "Quiz pass rate",      value: "72%" },
  { label: "Notes created today", value: "489" },
  { label: "New signups today",   value: "134" },
  { label: "Active right now",    value: "847", live: true },
  { label: "Open support tickets", badge: { text: "12 open", type: "warning" } },
];

const USERS = [
  { name: "Sara Khan",   initials: "SK", color: "#7c3aed", role: "Student",    roleType: "purple",  courses: 4,  status: "active",   joined: "Jun 28" },
  { name: "Ali Hassan",  initials: "AH", color: "#16a34a", role: "Instructor", roleType: "success", courses: 12, status: "active",   joined: "Jun 27" },
  { name: "Fatima R.",   initials: "FR", color: "#d97706", role: "Student",    roleType: "purple",  courses: 2,  status: "inactive", joined: "Jun 26" },
  { name: "Omar Siddiq", initials: "OS", color: "#dc2626", role: "Admin",      roleType: "warning", courses: 0,  status: "active",   joined: "Jun 25" },
  { name: "Ayesha B.",   initials: "AB", color: "#1d4ed8", role: "Student",    roleType: "purple",  courses: 7,  status: "active",   joined: "Jun 24" },
];

const ACTIVITIES = [
  { color: "#7c3aed", text: 'New course "Advanced SQL" submitted for review',    time: "2 min ago"  },
  { color: "#16a34a", text: "Ali Hassan enrolled 23 students via bulk upload",   time: "18 min ago" },
  { color: "#d97706", text: 'Quiz "Python Basics" flagged for high failure rate',time: "34 min ago" },
  { color: "#dc2626", text: "User report filed against course content",          time: "1 hr ago"   },
  { color: "#1d4ed8", text: "Monthly revenue report auto-generated",             time: "2 hr ago"   },
  { color: "#16a34a", text: "System backup completed successfully",              time: "3 hr ago"   },
];

const SYSTEM_HEALTH = [
  { label: "Server uptime", value: "99.9%", pct: 99.9, color: "#16a34a" },
  { label: "CPU usage",     value: "34%",   pct: 34,   color: "#7c3aed" },
  { label: "Memory",        value: "61%",   pct: 61,   color: "#d97706" },
  { label: "Storage",       value: "47%",   pct: 47,   color: "#1d4ed8" },
  { label: "API response",  value: "18 ms", pct: null,  color: "#16a34a" },
];

const TOP_COURSES = [
  { name: "Complete Python Bootcamp",  students: 2341, rating: 4.8 },
  { name: "Web Dev with React",        students: 1987, rating: 4.7 },
  { name: "Data Science Fundamentals", students: 1652, rating: 4.9 },
  { name: "UI/UX Design Principles",   students: 1201, rating: 4.6 },
  { name: "Machine Learning A-Z",      students: 984,  rating: 4.8 },
];

const PENDING_APPROVALS = [
  { text: "New instructor application — Zara Shah",   Icon: HiUsers,            iconColor: "#7c3aed", iconBg: "#ede9fe" },
  { text: '"Advanced React" course awaiting approval', Icon: HiBookOpen,         iconColor: "#16a34a", iconBg: "#dcfce7" },
  { text: "Bulk refund request (14 students)",         Icon: HiExclamationCircle,iconColor: "#dc2626", iconBg: "#fee2e2" },
  { text: "Admin role request — Omar Raza",            Icon: HiShieldCheck,      iconColor: "#d97706", iconBg: "#fef3c7" },
];

const REV_CATEGORIES = [
  { label: "Programming",  pct: 42, color: "#7c3aed" },
  { label: "Design",       pct: 21, color: "#16a34a" },
  { label: "Data Science", pct: 19, color: "#1d4ed8" },
  { label: "Business",     pct: 11, color: "#d97706" },
  { label: "Other",        pct: 7,  color: "#9ca3af" },
];

// ─── Donut SVG ───────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 110, thickness = 18 }) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circumference - 1.5;
        const offset = circumference - (cumulative / 100) * circumference;
        cumulative += seg.pct;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
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

// ─── Component ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const maxEnroll = Math.max(...ENROLL_DATA.map((d) => d.count));
  const peakIdx   = ENROLL_DATA.findIndex((d) => d.count === maxEnroll);

  return (
    <div className="dashboard-page">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1>Good morning, Mateen 👋</h1>
          <p>Here's what's happening across your academy today.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn">
            <HiDownload size={15} />
            Export
          </button>
          <button className="btn btn-primary">
            <HiPlus size={15} />
            Add course
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="kpi-grid">
        {KPI_DATA.map((kpi) => (
          <div className="kpi-card" key={kpi.label}>
            <div className={`kpi-icon-wrap ${kpi.colorClass}`}>
              <kpi.Icon size={20} />
            </div>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            <div className={`kpi-trend ${kpi.trendDir}`}>
              {kpi.trendDir === "up"
                ? <HiTrendingUp size={13} />
                : <HiTrendingDown size={13} />}
              {kpi.trend} {kpi.trendSub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Mid row ── */}
      <div className="mid-row">

        {/* Bar chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Enrollments — last 7 days</span>
          </div>
          <div className="card-body">
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

        {/* Donut */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">User roles</span>
          </div>
          <div className="card-body">
            <div className="donut-wrap">
              <div className="donut-svg-wrap">
                <DonutChart segments={ROLE_DATA} />
                <div className="donut-center-label">
                  <span>12k</span>
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

      {/* ── Bottom row: users table + system health ── */}
      <div className="bottom-row">

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
                      <td><span className={`badge ${u.roleType}`}>{u.role}</span></td>
                      <td>{u.courses}</td>
                      <td>
                        <span className={`badge ${u.status === "active" ? "success" : "warning"}`}>
                          {u.status === "active"
                            ? <HiCheckCircle size={11} style={{ marginRight: 3 }} />
                            : null}
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

        <div className="card">
          <div className="card-header">
            <span className="card-title">System health</span>
            <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }}>
              <HiRefresh size={13} />
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
                      <div className="progress-fill" style={{ width: `${h.pct}%`, background: h.color }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lower row ── */}
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
                    <HiStar size={13} />
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

        {/* Approvals + Revenue stacked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Pending approvals</span>
              <span className="badge danger">4</span>
            </div>
            <div className="card-body" style={{ paddingTop: 10 }}>
              <div className="approval-list">
                {PENDING_APPROVALS.map((p, i) => (
                  <div className="approval-item" key={i}>
                    <div className="approval-icon" style={{ background: p.iconBg, color: p.iconColor }}>
                      <p.Icon size={15} />
                    </div>
                    <div className="approval-body">
                      <div className="approval-text">{p.text}</div>
                      <div className="approval-actions">
                        <button className="btn btn-primary btn-sm">Approve</button>
                        <button className="btn btn-sm">Review</button>
                      </div>
                    </div>
                  </div>
                ))}
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