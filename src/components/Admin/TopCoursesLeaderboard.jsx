// src/components/admin/TopCoursesLeaderboard.jsx
import { FiAward, FiRefreshCw } from "react-icons/fi";

const MEDAL_COLORS = ["#d97706", "#94a3b8", "#b45309"]; // gold/silver/bronze tint for top 3

export default function TopCoursesLeaderboard({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="admin-panel">
        <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading…</p>
      </div>
    );
  }

  const top = stats.courses.top || [];
  const maxEnrolled = Math.max(1, ...top.map((c) => c.enrolledCount));

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Top Courses</h2>
        <span className="admin-panel-count">by enrollment</span>
      </div>

      {top.length === 0 ? (
        <p className="admin-panel-count">No enrollments yet.</p>
      ) : (
        <div className="admin-leaderboard">
          {top.map((c, i) => (
            <div key={c.id} className="admin-leaderboard-row">
              <div className="admin-leaderboard-rank" style={{ color: MEDAL_COLORS[i] || "#94a3b8" }}>
                {i < 3 ? <FiAward /> : <span>{i + 1}</span>}
              </div>
              <div className="admin-leaderboard-info">
                <p className="admin-leaderboard-title">{c.title}</p>
                <p className="admin-leaderboard-sub">{c.category} · ${c.revenue.toLocaleString()} revenue</p>
                <div className="admin-leaderboard-bar-track">
                  <div
                    className="admin-leaderboard-bar-fill"
                    style={{ width: `${(c.enrolledCount / maxEnrolled) * 100}%` }}
                  />
                </div>
              </div>
              <span className="admin-leaderboard-count">{c.enrolledCount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
