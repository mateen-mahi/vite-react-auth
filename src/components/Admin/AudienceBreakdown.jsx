// src/components/admin/AudienceBreakdown.jsx
import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { FiRefreshCw } from "react-icons/fi";

const ROLE_COLORS = {
  student: "#2563eb",
  instructor: "#7c3aed",
  admin: "#d97706",
  "super-admin": "#be185d",
  user: "#64748b",
};
const LEVEL_COLORS = { Beginner: "#16a34a", Intermediate: "#d97706", Advanced: "#ef4444" };
const TOOLTIP_STYLE = { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 };
const AXIS_TICK = { fontSize: 12, fill: "#64748b" };

export default function AudienceBreakdown({ stats, loading }) {
  const roleData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.users.byRole)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [stats]);

  const levelData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.courses.byLevel).map(([level, count]) => ({ level, count }));
  }, [stats]);

  if (loading || !stats) {
    return (
      <div className="admin-chart-card">
        <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading…</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-chart-card">
        <p className="admin-chart-title">User Roles</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
              {roleData.map((entry) => (
                <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="admin-chart-card">
        <p className="admin-chart-title">Courses by Level</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={levelData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="level" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {levelData.map((entry) => (
                <Cell key={entry.level} fill={LEVEL_COLORS[entry.level] || "#2563eb"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
