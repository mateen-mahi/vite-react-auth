// src/components/admin/SystemUsagePanel.jsx
//
// BACKEND REQUIRED (frontend only, as requested):
// 1. npm i systeminformation   (covers everything below in one library)
// 2. GET /admin/system-stats → full snapshot for the initial load, shape:
//    {
//      cpu: {
//        usagePercent, cores, model, speedGHz,
//        loadAvg: [1m, 5m, 15m],
//        perCore: [{ core: 0, usagePercent }, ...]
//      },
//      memory: {
//        usedMB, totalMB, freeMB, availableMB, usagePercent,
//        swap: { usedMB, totalMB, usagePercent }
//      },
//      disk: {
//        usedGB, totalGB, usagePercent,
//        partitions: [{ mount: "/", fs: "ext4", usedGB, totalGB, usagePercent }, ...]
//      },
//      network: {
//        interfaces: [{ name: "eth0", rxKbps, txKbps }, ...]
//      },
//      process: { pid, uptimeSeconds, heapUsedMB, heapTotalMB, rssMB },
//      topProcesses: [{ pid, name, cpuPercent, memPercent }, ...],  // optional, omit to hide
//      uptimeSeconds,
//      os: { platform, arch, hostname, release }
//    }
// 3. Emit the same shape every 3-5s over your admin socket as "system:stats"
//    so every open dashboard updates live instead of polling.
//
// Everything below degrades gracefully — any missing field just hides its
// section rather than crashing, so you can ship the basic fields first and
// add perCore/partitions/network/topProcesses/process later without
// touching this file again.

import { useEffect, useState, useCallback, useRef } from "react";
import {
  FiCpu, FiHardDrive, FiDatabase, FiClock, FiServer, FiWifi, FiWifiOff,
  FiRefreshCw, FiAlertCircle, FiChevronDown, FiChevronUp, FiArrowUp, FiArrowDown,
  FiBox, FiActivity,
} from "react-icons/fi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import api from "../../services/api";
import { useAdminSocket } from "../../custom-hooks/useAdminSocket";

const MAX_HISTORY_POINTS = 30;
const TOOLTIP_STYLE = { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 };
const AXIS_TICK = { fontSize: 11, fill: "#64748b" };

const formatUptime = (seconds) => {
  if (seconds == null) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Auto-scales KB/s → MB/s → GB/s so numbers stay readable regardless of load.
const formatRate = (kbps) => {
  if (kbps == null) return "—";
  if (kbps >= 1024 * 1024) return `${(kbps / (1024 * 1024)).toFixed(1)} GB/s`;
  if (kbps >= 1024) return `${(kbps / 1024).toFixed(1)} MB/s`;
  return `${kbps.toFixed(0)} KB/s`;
};

const usageTone = (pct) => {
  if (pct == null) return "unknown";
  if (pct >= 85) return "critical";
  if (pct >= 65) return "warning";
  return "good";
};

function UsageBar({ label, percent, icon: Icon, detail }) {
  const tone = usageTone(percent);
  return (
    <div className="sys-card">
      <div className="sys-card-top">
        <div className={`sys-card-icon ${tone}`}><Icon /></div>
        <div className="sys-card-info">
          <p className="sys-card-label">{label}</p>
          <p className="sys-card-value">{percent != null ? `${percent.toFixed(1)}%` : "—"}</p>
        </div>
      </div>
      <div className="sys-bar-track">
        <div
          className={`sys-bar-fill ${tone}`}
          style={{ width: `${percent != null ? Math.min(percent, 100) : 0}%` }}
        />
      </div>
      {detail && <p className="sys-card-detail">{detail}</p>}
    </div>
  );
}

function MiniBar({ label, percent }) {
  const tone = usageTone(percent);
  return (
    <div className="sys-mini-bar">
      <div className="sys-mini-bar-head">
        <span>{label}</span>
        <span>{percent != null ? `${percent.toFixed(0)}%` : "—"}</span>
      </div>
      <div className="sys-bar-track sys-bar-track-sm">
        <div className={`sys-bar-fill ${tone}`} style={{ width: `${percent != null ? Math.min(percent, 100) : 0}%` }} />
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, defaultOpen = true, children, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sys-section">
      <button className="sys-section-head" onClick={() => setOpen((o) => !o)}>
        <span className="sys-section-title">
          <Icon /> {title} {count != null && <span className="sys-section-count">({count})</span>}
        </span>
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && <div className="sys-section-body">{children}</div>}
    </div>
  );
}

export default function SystemUsagePanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const { isAdminConnected, subscribe } = useAdminSocket();
  const pollRef = useRef(null);

  const applyStats = useCallback((data) => {
    setStats(data);
    setHistory((prev) => {
      const totalRx = data.network?.interfaces?.reduce((sum, i) => sum + (i.rxKbps || 0), 0) ?? null;
      const totalTx = data.network?.interfaces?.reduce((sum, i) => sum + (i.txKbps || 0), 0) ?? null;
      const point = {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        cpu: data.cpu?.usagePercent ?? null,
        ram: data.memory?.usagePercent ?? null,
        rx: totalRx,
        tx: totalTx,
      };
      const next = [...prev, point];
      return next.length > MAX_HISTORY_POINTS ? next.slice(next.length - MAX_HISTORY_POINTS) : next;
    });
  }, []);

  const fetchOnce = useCallback(async () => {
    try {
      const res = await api.get("/admin/system-stats");
      setError(null);
      applyStats(res.data.stats || res.data);
    } catch (err) {
      console.error("Failed to load system stats:", err);
      setError("Couldn't load system stats. Confirm GET /admin/system-stats exists.");
    } finally {
      setLoading(false);
    }
  }, [applyStats]);

  useEffect(() => {
    fetchOnce();
  }, [fetchOnce]);

  useEffect(() => {
    const cleanup = subscribe("system:stats", (data) => {
      setError(null);
      setLoading(false);
      applyStats(data);
    });
    return cleanup;
  }, [subscribe, applyStats]);

  useEffect(() => {
    if (isAdminConnected) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(fetchOnce, 5000);
    return () => clearInterval(pollRef.current);
  }, [isAdminConnected, fetchOnce]);

  const hasNetwork = stats?.network?.interfaces?.length > 0;
  const hasPartitions = stats?.disk?.partitions?.length > 0;
  const hasCores = stats?.cpu?.perCore?.length > 0;
  const hasProcess = !!stats?.process;
  const hasTopProcesses = stats?.topProcesses?.length > 0;

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">System Usage</h2>
        <div className="sys-header-actions">
          <span className={`admin-connection-pill ${isAdminConnected ? "online" : "offline"}`}>
            {isAdminConnected ? <FiWifi /> : <FiWifiOff />}
            {isAdminConnected ? "Live" : "Polling (offline)"}
          </span>
          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={fetchOnce} disabled={loading}>
            <FiRefreshCw className={loading ? "cp-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {error && <p className="admin-panel-count sys-error"><FiAlertCircle /> {error}</p>}

      {loading && !stats ? (
        <p className="admin-panel-count"><FiRefreshCw className="cp-spin" /> Loading system stats…</p>
      ) : (
        <>
          {/* ---- top summary cards ---- */}
          <div className="sys-grid">
            <UsageBar
              label="CPU Usage"
              percent={stats?.cpu?.usagePercent}
              icon={FiCpu}
              detail={
                stats?.cpu
                  ? `${stats.cpu.cores ?? "?"} cores${stats.cpu.model ? ` · ${stats.cpu.model}` : ""}${
                      stats.cpu.speedGHz ? ` @ ${stats.cpu.speedGHz}GHz` : ""
                    }`
                  : null
              }
            />
            <UsageBar
              label="Memory (RAM)"
              percent={stats?.memory?.usagePercent}
              icon={FiDatabase}
              detail={
                stats?.memory
                  ? `${(stats.memory.usedMB / 1024).toFixed(1)} GB / ${(stats.memory.totalMB / 1024).toFixed(1)} GB used`
                  : null
              }
            />
            <UsageBar
              label="Disk Usage"
              percent={stats?.disk?.usagePercent}
              icon={FiHardDrive}
              detail={stats?.disk ? `${stats.disk.usedGB.toFixed(1)} GB / ${stats.disk.totalGB.toFixed(1)} GB` : null}
            />
            <div className="sys-card">
              <div className="sys-card-top">
                <div className="sys-card-icon good"><FiClock /></div>
                <div className="sys-card-info">
                  <p className="sys-card-label">Uptime</p>
                  <p className="sys-card-value">{formatUptime(stats?.uptimeSeconds)}</p>
                </div>
              </div>
              <p className="sys-card-detail">
                <FiServer style={{ marginRight: 4, verticalAlign: "-2px" }} />
                {stats?.os ? `${stats.os.hostname || "—"} · ${stats.os.platform}/${stats.os.arch}` : "—"}
              </p>
            </div>
          </div>

          {/* ---- load average + swap, side by side ---- */}
          <div className="sys-grid sys-grid-2">
            <div className="sys-card">
              <p className="sys-card-label" style={{ marginBottom: 10 }}>Load Average (1m / 5m / 15m)</p>
              {stats?.cpu?.loadAvg ? (
                <div className="sys-loadavg-row">
                  {stats.cpu.loadAvg.map((val, i) => (
                    <div key={i} className="sys-loadavg-chip">
                      <span className="sys-loadavg-label">{["1m", "5m", "15m"][i]}</span>
                      <span className="sys-loadavg-value">{val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sys-card-detail">—</p>
              )}
            </div>

            <div className="sys-card">
              <p className="sys-card-label" style={{ marginBottom: 10 }}>Swap Usage</p>
              {stats?.memory?.swap ? (
                <>
                  <MiniBar label="Swap" percent={stats.memory.swap.usagePercent} />
                  <p className="sys-card-detail" style={{ marginTop: 8 }}>
                    {(stats.memory.swap.usedMB / 1024).toFixed(1)} GB / {(stats.memory.swap.totalMB / 1024).toFixed(1)} GB
                  </p>
                </>
              ) : (
                <p className="sys-card-detail">No swap data reported.</p>
              )}
            </div>
          </div>

          {/* ---- per-core CPU breakdown ---- */}
          {hasCores && (
            <Section title="CPU Cores" icon={FiCpu} count={stats.cpu.perCore.length} defaultOpen={false}>
              <div className="sys-core-grid">
                {stats.cpu.perCore.map((c) => (
                  <MiniBar key={c.core} label={`Core ${c.core}`} percent={c.usagePercent} />
                ))}
              </div>
            </Section>
          )}

          {/* ---- disk partitions ---- */}
          {hasPartitions && (
            <Section title="Disk Partitions" icon={FiHardDrive} count={stats.disk.partitions.length}>
              <div className="sys-partition-list">
                {stats.disk.partitions.map((p) => (
                  <div className="sys-partition-row" key={p.mount}>
                    <div className="sys-partition-info">
                      <span className="sys-partition-mount">{p.mount}</span>
                      <span className="sys-partition-fs">{p.fs}</span>
                    </div>
                    <div className="sys-partition-bar-wrap">
                      <div className="sys-bar-track sys-bar-track-sm">
                        <div
                          className={`sys-bar-fill ${usageTone(p.usagePercent)}`}
                          style={{ width: `${Math.min(p.usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="sys-partition-detail">
                      {p.usedGB.toFixed(1)} / {p.totalGB.toFixed(1)} GB
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ---- network interfaces ---- */}
          {hasNetwork && (
            <Section title="Network" icon={FiActivity} count={stats.network.interfaces.length}>
              <div className="sys-net-grid">
                {stats.network.interfaces.map((iface) => (
                  <div className="sys-net-card" key={iface.name}>
                    <p className="sys-net-name">{iface.name}</p>
                    <div className="sys-net-row">
                      <span className="sys-net-rate down"><FiArrowDown /> {formatRate(iface.rxKbps)}</span>
                      <span className="sys-net-rate up"><FiArrowUp /> {formatRate(iface.txKbps)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ---- Node process footprint ---- */}
          {hasProcess && (
            <Section title="Node Process" icon={FiBox}>
              <div className="sys-process-grid">
                <div className="sys-process-stat">
                  <span className="sys-process-label">PID</span>
                  <span className="sys-process-value">{stats.process.pid}</span>
                </div>
                <div className="sys-process-stat">
                  <span className="sys-process-label">Process Uptime</span>
                  <span className="sys-process-value">{formatUptime(stats.process.uptimeSeconds)}</span>
                </div>
                <div className="sys-process-stat">
                  <span className="sys-process-label">Heap Used</span>
                  <span className="sys-process-value">
                    {stats.process.heapUsedMB.toFixed(0)} / {stats.process.heapTotalMB.toFixed(0)} MB
                  </span>
                </div>
                <div className="sys-process-stat">
                  <span className="sys-process-label">RSS</span>
                  <span className="sys-process-value">{stats.process.rssMB.toFixed(0)} MB</span>
                </div>
              </div>
            </Section>
          )}

          {/* ---- top processes (optional) ---- */}
          {hasTopProcesses && (
            <Section title="Top Processes" icon={FiServer} count={stats.topProcesses.length} defaultOpen={false}>
              <div className="sys-table-wrap">
                <table className="admin-table sys-process-table">
                  <thead>
                    <tr><th>PID</th><th>Name</th><th>CPU</th><th>Memory</th></tr>
                  </thead>
                  <tbody>
                    {stats.topProcesses.map((p) => (
                      <tr key={p.pid}>
                        <td className="admin-cell-secondary">{p.pid}</td>
                        <td className="admin-cell-primary">{p.name}</td>
                        <td className="admin-cell-secondary">{p.cpuPercent.toFixed(1)}%</td>
                        <td className="admin-cell-secondary">{p.memPercent.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* ---- live history charts ---- */}
          <div className="sys-charts-grid">
            <div className="admin-chart-card sys-chart-card">
              <p className="admin-chart-title">CPU &amp; RAM — last {history.length} samples</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={AXIS_TICK} minTickGap={24} />
                  <YAxis tick={AXIS_TICK} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="ram" name="RAM %" stroke="#16a34a" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
              {history.length === 0 && <p className="sys-chart-empty">Waiting for the first data point…</p>}
            </div>

            {hasNetwork && (
              <div className="admin-chart-card sys-chart-card">
                <p className="admin-chart-title">Network Throughput (KB/s)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={AXIS_TICK} minTickGap={24} />
                    <YAxis tick={AXIS_TICK} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="rx" name="Download" stroke="#0891b2" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="tx" name="Upload" stroke="#be185d" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
