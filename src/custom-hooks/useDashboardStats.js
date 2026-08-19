// src/custom-hooks/useDashboardStats.js
import { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import { useAdminSocket } from "./useAdminSocket";

/**
 * Single source of truth for the admin overview tab.
 *
 * Strategy: REST fetch on mount (fast first paint, works even if the socket
 * is still connecting) → then two layers of live updates:
 *
 *   1. Authoritative full refresh — the server pushes a complete recomputed
 *      snapshot on "dashboard:stats" every ~30s while an admin is watching
 *      (see dashboardStatsEmitter.js). This is the source of truth; it always
 *      overwrites local state, so any optimistic drift below self-corrects
 *      within 30s at worst.
 *
 *   2. Optimistic nudges — granular events (user:registered, course:created,
 *      complaint:new/statusChanged) bump the relevant counter the instant
 *      they happen, so the UI doesn't feel like it's on a 30s delay. These
 *      are cosmetic only; layer 1 is what's actually correct.
 *
 * Every component under the Overview tab should consume `stats` from here
 * rather than fetching independently — one fetch, one socket subscription,
 * one consistent number on screen everywhere.
 */
export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { subscribe, onlineAdmins, isAdminConnected } = useAdminSocket();
  const loadedOnce = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get("/admin/dashboard-stats");
      setStats(res.data.stats);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError("Couldn't load dashboard stats.");
    } finally {
      setLoading(false);
      loadedOnce.current = true;
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Layer 1 — authoritative periodic full snapshot
  useEffect(() => {
    return subscribe("dashboard:stats", (fresh) => setStats(fresh));
  }, [subscribe]);

  // Layer 2 — optimistic instant nudges
  useEffect(() => {
    const cleanups = [
      subscribe("user:registered", () => {
        setStats((prev) => prev && {
          ...prev,
          users: { ...prev.users, total: prev.users.total + 1, newThisWeek: prev.users.newThisWeek + 1 },
        });
      }),
      subscribe("course:created", () => {
        setStats((prev) => prev && {
          ...prev,
          courses: { ...prev.courses, total: prev.courses.total + 1, newThisWeek: prev.courses.newThisWeek + 1 },
        });
      }),
      subscribe("complaint:new", () => {
        setStats((prev) => prev && {
          ...prev,
          complaints: { ...prev.complaints, total: prev.complaints.total + 1, pending: prev.complaints.pending + 1 },
        });
      }),
      subscribe("complaint:statusChanged", (complaint) => {
        setStats((prev) => {
          if (!prev || complaint.status === "pending") return prev; // was already counted as pending
          return { ...prev, complaints: { ...prev.complaints, pending: Math.max(0, prev.complaints.pending - 1) } };
        });
      }),
    ];
    return () => cleanups.forEach((c) => c());
  }, [subscribe]);

  return { stats, loading, error, onlineAdmins, isAdminConnected, refetch: fetchStats };
}
