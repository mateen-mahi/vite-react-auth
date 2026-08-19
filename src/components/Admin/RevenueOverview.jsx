// src/components/admin/RevenueOverview.jsx
import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { FiDollarSign, FiCreditCard, FiPercent, FiRefreshCw } from "react-icons/fi";

const TOOLTIP_STYLE = { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 };
const AXIS_TICK = { fontSize: 12, fill: "#64748b" };
const GATEWAY_LABELS = { stripe: "Stripe", paypal: "PayPal", razorpay: "Razorpay", free_coupon: "Free Coupon" };
const STATUS_TONE = { completed: "verified", pending: "unverified", failed: "banned", refunded: "info" };

export default function RevenueOverview({ stats, loading }) {
  const trend = useMemo(
    () => (stats?.trends?.revenue || []).map((r) => ({ month: r.month, total: r.total })),
    [stats?.trends?.revenue] // narrow dep — unrelated socket updates (complaint/user bumps) shouldn't recreate this array
  );

  if (loading || !stats) {
    return (
      <div className="admin-panel">
        <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading revenue…</p>
      </div>
    );
  }

  const { revenue } = stats;
  const maxGateway = Math.max(1, ...revenue.byGateway.map((g) => g.total));

  return (
    <div className="admin-panel admin-revenue-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Revenue</h2>
        <span className="admin-panel-count">
          ${revenue.total.toLocaleString()} total · {revenue.totalCompletedOrders} orders
        </span>
      </div>

      <div className="admin-revenue-grid">
        {/* Trend chart */}
        <div className="admin-revenue-trend">
          <ResponsiveContainer width="100%" height={200} debounce={200} minWidth={200}>
            <AreaChart data={trend} margin={{ left: -20, top: 6 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                isAnimationActive={false} // stroke animation is the piece that breaks on a mid-render width flicker
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Side stats */}
        <div className="admin-revenue-side">
          <div className="admin-revenue-stat">
            <FiDollarSign />
            <div>
              <p className="admin-revenue-stat-value">${revenue.avgOrderValue.toLocaleString()}</p>
              <p className="admin-revenue-stat-label">Avg. order value</p>
            </div>
          </div>
          <div className="admin-revenue-stat">
            <FiPercent />
            <div>
              <p className="admin-revenue-stat-value">{revenue.change}</p>
              <p className="admin-revenue-stat-label">Week-over-week</p>
            </div>
          </div>
          <div className="admin-revenue-orders">
            {Object.entries(revenue.ordersByStatus).map(([status, count]) => (
              <span key={status} className={`admin-status-badge ${STATUS_TONE[status] || "info"}`}>
                {count} {status}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Gateway breakdown */}
      {revenue.byGateway.length > 0 && (
        <div className="admin-gateway-list">
          <div className="admin-gateway-list-header">
            <FiCreditCard /> <span>By payment gateway</span>
          </div>
          {revenue.byGateway.map((g) => (
            <div key={g.gateway} className="admin-gateway-row">
              <span className="admin-gateway-name">{GATEWAY_LABELS[g.gateway] || g.gateway}</span>
              <div className="admin-gateway-bar-track">
                <div className="admin-gateway-bar-fill" style={{ width: `${(g.total / maxGateway) * 100}%` }} />
              </div>
              <span className="admin-gateway-value">${g.total.toLocaleString()} · {g.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}