// src/components/admin/ComplaintsInsights.jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FiClock, FiRefreshCw } from "react-icons/fi";

const STATUS_COLORS = { pending: "#d97706", "in progress": "#2563eb", resolved: "#16a34a" };
const TOOLTIP_STYLE = { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 };

export default function ComplaintsInsights({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="admin-panel">
        <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading…</p>
      </div>
    );
  }

  const { complaints } = stats;
  const data = [
    { name: "pending", value: complaints.pending },
    { name: "in progress", value: complaints.inProgress },
    { name: "resolved", value: complaints.resolved },
  ].filter((d) => d.value > 0);

  return (
    <div className="admin-panel admin-complaints-insight">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Complaints</h2>
        <span className="admin-panel-count">{complaints.total} total</span>
      </div>

      <div className="admin-complaints-grid">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
              {data.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>

        <div className="admin-complaints-legend">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="admin-complaints-legend-row">
              <span className="admin-legend-dot" style={{ background: color }} />
              <span className="admin-legend-label">{status}</span>
              <span className="admin-legend-value">
                {status === "pending" ? complaints.pending : status === "in progress" ? complaints.inProgress : complaints.resolved}
              </span>
            </div>
          ))}
          <div className="admin-complaints-resolution">
            <FiClock />
            <span>
              {complaints.avgResolutionHours > 0
                ? `~${complaints.avgResolutionHours}h avg. resolution time`
                : "No resolved complaints yet"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
