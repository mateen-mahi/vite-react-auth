// src/components/admin/KpiCards.jsx
import { useMemo } from "react";
import {
  FiUsers, FiCheckCircle, FiBookOpen, FiPlayCircle, FiHelpCircle,
  FiDollarSign, FiAlertCircle, FiActivity, FiWifi,
} from "react-icons/fi";
import {
  DUMMY_USERS, DUMMY_COURSES, DUMMY_LECTURES, DUMMY_QUIZZES,
  DUMMY_COMPLAINTS, DUMMY_LOGIN_HISTORY,
} from "../../data/dummyAdminData";

const daysAgo = (dateStr) => (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);

export default function KpiCards({ onlineCount }) {
  const stats = useMemo(() => {
    const totalUsers = DUMMY_USERS.length;
    const verified   = DUMMY_USERS.filter((u) => u.isVerified).length;
    const revenue    = DUMMY_COURSES.reduce((sum, c) => sum + c.price * c.studentsEnrolledCount, 0);

    const dau = new Set(DUMMY_LOGIN_HISTORY.filter((l) => daysAgo(l.loginAt) <= 1).map((l) => l.userId)).size;
    const wau = new Set(DUMMY_LOGIN_HISTORY.filter((l) => daysAgo(l.loginAt) <= 7).map((l) => l.userId)).size;
    const mau = new Set(DUMMY_LOGIN_HISTORY.filter((l) => daysAgo(l.loginAt) <= 30).map((l) => l.userId)).size;

    return {
      totalUsers,
      verified,
      totalCourses: DUMMY_COURSES.length,
      totalLectures: DUMMY_LECTURES.length,
      totalQuizzes: DUMMY_QUIZZES.length,
      pendingComplaints: DUMMY_COMPLAINTS.filter((c) => c.status === "pending").length,
      revenue,
      dau, wau, mau,
    };
  }, []);

  const cards = [
    { label: "Total Users",         value: stats.totalUsers.toLocaleString(),          icon: FiUsers,       color: "#2563eb" },
    { label: "Verified Users",      value: `${stats.verified} / ${stats.totalUsers}`,   icon: FiCheckCircle, color: "#16a34a" },
    { label: "Total Courses",       value: stats.totalCourses,                          icon: FiBookOpen,    color: "#7c3aed" },
    { label: "Total Lectures",      value: stats.totalLectures,                         icon: FiPlayCircle,  color: "#0891b2" },
    { label: "Total Quizzes",       value: stats.totalQuizzes,                          icon: FiHelpCircle,  color: "#d97706" },
    { label: "Est. Revenue",        value: `$${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: FiDollarSign, color: "#059669" },
    { label: "Pending Complaints",  value: stats.pendingComplaints,                     icon: FiAlertCircle, color: "#ef4444" },
    { label: "Online Now",          value: onlineCount, icon: FiWifi, color: "#16a34a", live: true },
    { label: "DAU / WAU / MAU",     value: `${stats.dau} / ${stats.wau} / ${stats.mau}`, icon: FiActivity,    color: "#2563eb" },
  ];

  return (
    <div className="admin-kpi-grid">
      {cards.map((c) => (
        <div key={c.label} className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: c.color + "14", color: c.color }}>
            <c.icon />
          </div>
          <div>
            <p className="admin-kpi-value">
              {c.value}
              {c.live && <span className="admin-live-dot" />}
            </p>
            <p className="admin-kpi-label">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
