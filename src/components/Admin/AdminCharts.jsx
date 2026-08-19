// src/components/admin/AdminCharts.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { FiRefreshCw } from "react-icons/fi";

const TOOLTIP_STYLE = { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 };
const AXIS_TICK = { fontSize: 12, fill: "#64748b" };

// Real 6-month signup trend — sourced from stats.trends.signups
// (see dashboardStats.service.js), replacing the old DUMMY_USERS version.
export function SignupTrendChart({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="admin-chart-card">
        <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading…</p>
      </div>
    );
  }

  const data = stats.trends?.signups || [];

  return (
    <div className="admin-chart-card">
      <p className="admin-chart-title">Signups Over Time</p>
      <ResponsiveContainer width="100%" height={220} debounce={200} minWidth={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}