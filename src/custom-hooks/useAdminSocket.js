// src/custom-hooks/useAdminSocket.js
import { useState, useEffect, useCallback } from "react";
import adminSocket from "../socket/adminSocket.js";
import { useAuth } from "../context/AuthContext.jsx";

const MAX_FEED_ITEMS = 50;

// Human-readable label for each event type — used by the live feed and
// reused anywhere else you want to describe an admin event generically.
const EVENT_LABELS = {
  "user:registered":         (d) => `New user registered: ${d.username}`,
  "course:created":          (d) => `New course created: ${d.title}`,
  "course:updated":          (d) => `Course updated: ${d.title}`,
  "enrollment:new":          (d) => `New enrollment: ${d.courseTitle}`,
  "complaint:new":           (d) => `New complaint: ${d.subject}`,
  "complaint:statusChanged": (d) => `Complaint status → ${d.status}`,
  "login:new":               (d) => `${d.username} logged in`,
  "login:failed":            (d) => `Failed login attempt: ${d.email}`,
  "order:completed":         (d) => `Order completed: $${d.amountPaid} via ${d.paymentGateway}`,
  "certificate:issued":      (d) => `Certificate issued: ${d.certificateNumber}`,
};

// Generates a feed-item id that's unique across the whole app lifetime, not
// just within one mount. A plain incrementing counter (0, 1, 2...) resets to
// 0 every time this hook remounts, which collides with read-IDs persisted in
// localStorage from a previous session and silently marks fresh events as
// already-read. This is unique enough without a uuid dependency.
const makeFeedId = (eventName) =>
  `${eventName}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Connects to the /admin namespace and gives you:
 *   - isAdminConnected: connection status for this specific namespace
 *   - onlineAdmins: how many admins are watching the dashboard right now
 *   - onlineUsers: how many actual users are online site-wide right now
 *     (distinct from onlineAdmins — pushed by the server via "site:onlineUsers",
 *     see config/socket.js and sockets/handler.js)
 *   - feed: rolling list of the last 50 admin events, newest first
 *   - subscribe(event, callback): register a handler for ONE event type,
 *     returns a cleanup function — same pattern as useSocket's onEvent
 *
 * Only ever call connectAdminSocket() after confirming the user's role is
 * admin/super-admin — the SERVER also verifies this independently (see
 * config/socket.js), so this is a UX nicety, not the actual security boundary.
 */
export const useAdminSocket = () => {
  const { user } = useAuth();
  const [isAdminConnected, setIsAdminConnected] = useState(adminSocket.connected);
  const [onlineAdmins, setOnlineAdmins] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [feed, setFeed] = useState([]);

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  // Connect/disconnect based on role — mirrors the main socket's pattern
  useEffect(() => {
    if (isAdmin && !adminSocket.connected) {
      adminSocket.auth = { userId: user._id };
      adminSocket.connect();
    } else if (!isAdmin && adminSocket.connected) {
      adminSocket.disconnect();
    }
  }, [isAdmin, user?._id]);

  // Core lifecycle + generic feed listener — registered once
  useEffect(() => {
    const onConnect    = () => setIsAdminConnected(true);
    const onDisconnect = () => { setIsAdminConnected(false); setOnlineAdmins(0); setOnlineUsers(0); };
    const onPresence    = ({ onlineAdmins }) => setOnlineAdmins(onlineAdmins);
    const onSiteOnlineUsers = ({ count }) => setOnlineUsers(count);

    // Generic catch-all: every named event in EVENT_LABELS also gets pushed
    // into the rolling feed, so LiveActivityPanel doesn't need to know about
    // each event type individually.
    const feedHandlers = Object.keys(EVENT_LABELS).map((eventName) => {
      const handler = (data) => {
        setFeed((prev) => [
          {
            id: makeFeedId(eventName),
            event: eventName,
            text: EVENT_LABELS[eventName](data),
            data,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, MAX_FEED_ITEMS));
      };
      adminSocket.on(eventName, handler);
      return { eventName, handler };
    });

    adminSocket.on("connect", onConnect);
    adminSocket.on("disconnect", onDisconnect);
    adminSocket.on("admin:presence", onPresence);
    adminSocket.on("site:onlineUsers", onSiteOnlineUsers);

    return () => {
      adminSocket.off("connect", onConnect);
      adminSocket.off("disconnect", onDisconnect);
      adminSocket.off("admin:presence", onPresence);
      adminSocket.off("site:onlineUsers", onSiteOnlineUsers);
      feedHandlers.forEach(({ eventName, handler }) => adminSocket.off(eventName, handler));
    };
  }, []);

  // Subscribe to ONE event type with your own callback (in addition to the
  // automatic feed entry above) — e.g. to bump a specific KPI counter.
  const subscribe = useCallback((event, callback) => {
    adminSocket.on(event, callback);
    return () => adminSocket.off(event, callback);
  }, []);

  return { isAdminConnected, onlineAdmins, onlineUsers, feed, subscribe };
};
