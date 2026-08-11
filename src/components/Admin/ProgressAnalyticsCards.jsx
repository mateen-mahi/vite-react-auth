import { useState, useEffect } from "react";
import {
  FiUsers, FiCheckCircle, FiTrendingUp, FiBarChart2, FiRefreshCw, FiBookOpen,
} from "react-icons/fi";
import api from "../../services/api";
import { useAdminSocket } from "../../custom-hooks/useAdminSocket";
import "../../styles/ProgressAnalyticsCards.css";

const EMPTY = { totalRecords: 0, totalCompleted: 0, completionRate: 0, avgProgress: 0, perCourse: [] };

export default function ProgressAnalyticsCards() {
  const [analytics, setAnalytics] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { subscribe } = useAdminSocket();

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const res = await api.get("/admin/analytics");
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error("Failed to load progress analytics:", err);
      setError("Couldn't load progress analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Live nudge on course completions — exact totals still come from a
  // refetch, this just keeps the number from feeling stale between polls.
  useEffect(() => {
    const cleanups = [
      subscribe("progress:courseCompleted", () => {
        setAnalytics((prev) => {
          const totalCompleted = prev.totalCompleted + 1;
          const completionRate =
            prev.totalRecords > 0 ? Math.round((totalCompleted / prev.totalRecords) * 100) : prev.completionRate;
          return { ...prev, totalCompleted, completionRate };
        });
      }),
    ];
    return () => cleanups.forEach((c) => c());
  }, [subscribe]);

  if (loading) {
    return (
      <div className="pa-section">
        <div className="pa-kpi-grid">
          <div className="pa-kpi-card pa-loading">
            <FiRefreshCw className="pa-spin" /> Loading progress analytics…
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Progress Records", value: analytics.totalRecords.toLocaleString(), icon: FiUsers, color: "#2563eb" },
    { label: "Courses Completed", value: analytics.totalCompleted.toLocaleString(), icon: FiCheckCircle, color: "#16a34a" },
    { label: "Completion Rate", value: `${analytics.completionRate}%`, icon: FiTrendingUp, color: "#7c3aed" },
    { label: "Avg. Progress", value: `${analytics.avgProgress}%`, icon: FiBarChart2, color: "#0891b2" },
  ];

  const topCourses = [...(analytics.perCourse || [])]
    .sort((a, b) => b.totalEnrolled - a.totalEnrolled)
    .slice(0, 5);

  return (
    <div className="pa-section">
      <div className="pa-section-header">
        <h2 className="pa-section-title">Progress Analytics</h2>
        <button className="pa-refresh-btn" onClick={fetchAnalytics} title="Refresh">
          <FiRefreshCw />
        </button>
      </div>

      {error && <div className="pa-error">{error}</div>}

      <div className="pa-kpi-grid">
        {cards.map((c) => (
          <div key={c.label} className="pa-kpi-card">
            <div className="pa-kpi-icon" style={{ background: c.color + "14", color: c.color }}>
              <c.icon />
            </div>
            <div>
              <p className="pa-kpi-value">{c.value}</p>
              <p className="pa-kpi-label">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {topCourses.length > 0 && (
        <div className="pa-course-list">
          <div className="pa-course-list-header">
            <FiBookOpen /> <span>Courses by enrollment</span>
          </div>
          {topCourses.map((c) => (
            <div key={c.courseId} className="pa-course-row">
              <div className="pa-course-info">
                <p className="pa-course-name">{c.courseTitle || "Untitled course"}</p>
                <p className="pa-course-sub">
                  {c.totalEnrolled} enrolled · {c.totalCompleted} completed
                </p>
              </div>
              <div className="pa-course-bar-wrap">
                <div className="pa-course-bar-track">
                  <div className="pa-course-bar-fill" style={{ width: `${c.avgProgress}%` }} />
                </div>
                <span className="pa-course-bar-label">{c.avgProgress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}