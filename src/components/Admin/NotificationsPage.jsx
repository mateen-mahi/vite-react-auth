import { useEffect, useMemo, useState } from "react";
import {
  FiBell, FiUserPlus, FiBookOpen, FiUserCheck, FiAlertCircle, FiRefreshCw,
  FiLogIn, FiLogOut, FiCheck, FiWifi, FiWifiOff, FiInbox, FiDollarSign, FiAward,
} from "react-icons/fi";
import { useAdminSocket } from "../../custom-hooks/useAdminSocket";
import "../../styles/NotificationsPage.css"

const READ_STORAGE_KEY = "admin_notifications_read_ids";

// Icon + color + filter-group per event type — mirrors the event keys in
// useAdminSocket.js's EVENT_LABELS so every emitted event is covered.
const EVENT_META = {
  "user:registered":         { icon: FiUserPlus,   tone: "blue",   group: "users" },
  "course:created":          { icon: FiBookOpen,   tone: "purple", group: "courses" },
  "course:updated":          { icon: FiBookOpen,   tone: "purple", group: "courses" },
  "enrollment:new":          { icon: FiUserCheck,  tone: "green",  group: "courses" },
  "complaint:new":           { icon: FiAlertCircle, tone: "amber",  group: "complaints" },
  "complaint:statusChanged": { icon: FiRefreshCw,  tone: "blue",   group: "complaints" },
  "login:new":               { icon: FiLogIn,      tone: "green",  group: "users" },
  "login:failed":            { icon: FiLogOut,     tone: "red",    group: "users" },
  "order:completed":         { icon: FiDollarSign, tone: "green",  group: "revenue" },
  "certificate:issued":      { icon: FiAward,      tone: "purple", group: "certificates" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "users", label: "Users & Logins" },
  { key: "courses", label: "Courses" },
  { key: "complaints", label: "Complaints" },
  { key: "revenue", label: "Revenue" },
  { key: "certificates", label: "Certificates" },
];

const loadReadIds = () => {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadIds = (set) => {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore quota errors — read state just won't persist, non-critical */
  }
};

const timeAgo = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
};

export default function NotificationsPage() {
  const { feed, isAdminConnected, onlineAdmins } = useAdminSocket();
  const [readIds, setReadIds] = useState(loadReadIds);
  const [activeFilter, setActiveFilter] = useState("all");

  // Persist read state whenever it changes
  useEffect(() => {
    saveReadIds(readIds);
  }, [readIds]);

  const markAsRead = (id) => {
    setReadIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      feed.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const unreadCount = useMemo(
    () => feed.filter((item) => !readIds.has(item.id)).length,
    [feed, readIds]
  );

  const filtered = useMemo(() => {
    if (activeFilter === "all") return feed;
    return feed.filter((item) => (EVENT_META[item.event]?.group || "other") === activeFilter);
  }, [feed, activeFilter]);

  return (
    <div className="admin-panel notif-page">
      <div className="admin-panel-header">
        <div className="notif-title-row">
          <div className="notif-bell-wrap">
            <FiBell />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </div>
          <h2 className="admin-panel-title">Notifications</h2>
        </div>
        <div className="sys-header-actions">
          <span className={`admin-connection-pill ${isAdminConnected ? "online" : "offline"}`}>
            {isAdminConnected ? <FiWifi /> : <FiWifiOff />}
            {isAdminConnected ? `Live · ${onlineAdmins} admin${onlineAdmins === 1 ? "" : "s"} online` : "Disconnected"}
          </span>
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <FiCheck /> Mark all read
          </button>
        </div>
      </div>

      <div className="notif-filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`notif-filter-chip ${activeFilter === f.key ? "active" : ""}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="notif-empty">
          <FiInbox />
          <p className="notif-empty-title">All quiet here</p>
          <p className="notif-empty-sub">
            {activeFilter === "all"
              ? "New signups, courses, enrollments, complaints, orders, and certificates will show up here as they happen."
              : "No notifications in this category yet."}
          </p>
        </div>
      ) : (
        <div className="notif-list">
          {filtered.map((item) => {
            const meta = EVENT_META[item.event] || { icon: FiBell, tone: "blue" };
            const Icon = meta.icon;
            const isUnread = !readIds.has(item.id);
            return (
              <button
                key={item.id}
                className={`notif-item ${isUnread ? "unread" : ""}`}
                onClick={() => markAsRead(item.id)}
              >
                <div className={`notif-icon ${meta.tone}`}>
                  <Icon />
                </div>
                <div className="notif-item-body">
                  <p className="notif-item-text">{item.text}</p>
                  <span className="notif-item-time">{timeAgo(item.timestamp)}</span>
                </div>
                {isUnread && <span className="notif-dot" title="Unread" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}