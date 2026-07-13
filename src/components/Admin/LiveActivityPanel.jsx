// src/components/admin/LiveActivityPanel.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiWifi, FiWifiOff, FiActivity, FiUser } from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────
// WHAT'S REAL HERE vs WHAT'S DUMMY:
//
//   REAL  — connection status (isConnected from your actual socket)
//   REAL  — activity feed items, sourced from the existing "receive-global-message"
//           event (a genuine live event already flowing through your app)
//   DUMMY — "Online users" count. There is currently no event that reports
//           how many users are connected platform-wide.
//
// To make this fully real per Section 12 of the admin guide, you'd need:
//   1. A dedicated `/admin` namespace on the backend (io.of("/admin"))
//   2. user:online / user:offline emitted to it on every connect/disconnect
//   3. complaint:new, enrollment:new, quiz:attempted etc. emitted from your
//      controllers via something like emitToAdmin(event, data)
// That's backend work — say the word and I'll build it next.
// ─────────────────────────────────────────────────────────────────────────
export default function LiveActivityPanel() {
  const { isConnected, onEvent } = useAuth();
  const [feed, setFeed] = useState([]);
  const [onlineCount, setOnlineCount] = useState(37); // DUMMY — see note above

  useEffect(() => {
    const cleanup = onEvent("receive-global-message", (msg) => {
      setFeed((prev) =>
        [
          { id: msg.id, text: `${msg.sender} sent a global message`, timestamp: msg.timestamp },
          ...prev,
        ].slice(0, 15)
      );
    });
    return cleanup;
  }, [onEvent]);

  // Cosmetic drift so the dummy count doesn't look frozen — remove once real
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((c) => Math.max(10, c + (Math.random() > 0.5 ? 1 : -1)));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Live Activity</h2>
        <span className={`admin-connection-pill ${isConnected ? "online" : "offline"}`}>
          {isConnected ? <FiWifi /> : <FiWifiOff />}
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="admin-live-grid">
        <div className="admin-live-stat">
          <FiUser className="admin-live-stat-icon" />
          <div>
            <p className="admin-live-stat-value">{onlineCount}</p>
            <p className="admin-live-stat-label">Online users (demo)</p>
          </div>
        </div>
      </div>

      <div className="admin-activity-feed">
        {feed.length === 0 ? (
          <div className="admin-feed-empty">
            <FiActivity />
            <p>Live events will appear here as they happen. Try sending a global chat message.</p>
          </div>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="admin-feed-item">
              <span className="admin-feed-dot" />
              <p className="admin-feed-text">{item.text}</p>
              <span className="admin-feed-time">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
