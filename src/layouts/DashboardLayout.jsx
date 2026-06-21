import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Sidebar.css";

/* ── Icons ─────────────────────────────────────────── */
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  lectures: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M9.5 8.3 L15 10.5 L9.5 12.7 Z" fill="currentColor" stroke="none" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  ),
  quiz: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M9.2 9.3a2.8 2.8 0 0 1 5.4.9c0 1.9-2.6 2.3-2.6 4.1" strokeLinecap="round" />
      <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" strokeLinecap="round" />
      <path d="M16 4.3c1.7.4 3 2 3 3.9 0 1.9-1.3 3.5-3 3.9" strokeLinecap="round" />
      <path d="M19 13.8c2 .7 3.5 2.6 3.5 5" strokeLinecap="round" />
    </svg>
  ),
  payment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="5" width="20" height="14" rx="2.2" />
      <path d="M2 9.5h20" />
      <path d="M5.5 14.8h4" strokeLinecap="round" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8.5 20H5.5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" strokeLinecap="round" />
      <path d="M14.5 16.5 19 12 14.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 12H8.5" strokeLinecap="round" />
    </svg>
  ),
  collapse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  ),
};

/* ── Nav config: single source of truth for who sees what ── */
const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "dashboard", roles: ["end-user", "admin", "super-admin"] },
      { to: "/lectures", label: "Lecture Watching", icon: "lectures", roles: ["end-user", "admin", "super-admin"] },
      { to: "/grand-quiz", label: "Grand Quiz", icon: "quiz", roles: ["end-user", "admin", "super-admin"] },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/user-management", label: "User Management", icon: "users", roles: ["admin", "super-admin"] },
      { to: "/payment-gateway", label: "Payment Gateway", icon: "payment", roles: ["super-admin"] },
    ],
  },
];

const roleLabel = {
  "end-user": "Student",
  admin: "Admin",
  "super-admin": "Super Admin",
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";

/* ── Sidebar ───────────────────────────────────────── */
const Sidebar = ({ role, userName = "User" }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close mobile drawer on route change / Escape key
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/logout", {}, { withCredentials: true });
    } catch (_) {
      // proceed to login regardless — session is being cleared client-side either way
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <button
          className="icon-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          {icons.menu}
        </button>
        <span className="mobile-topbar__brand">Project</span>
        <span className="mobile-topbar__avatar" aria-hidden="true">
          {getInitials(userName)}
        </span>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={[
          "sidebar",
          collapsed ? "sidebar--collapsed" : "",
          mobileOpen ? "sidebar--mobile-open" : "",
        ].join(" ").trim()}
      >
        {/* Brand row */}
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark">
            <span className="sidebar__logo">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2 L20 5.5 V11 C20 16 16.5 19.8 12 21 C7.5 19.8 4 16 4 11 V5.5 L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__name">AppName</span>}
          </div>

          <button
            className="icon-btn sidebar__close-mobile"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            {icons.close}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar__nav" aria-label="Main navigation">
          {visibleSections.map((section) => (
            <div className="sidebar__section" key={section.label}>
              {!collapsed && <p className="sidebar__section-label">{section.label}</p>}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    "sidebar__link" + (isActive ? " is-active" : "")
                  }
                  onClick={() => setMobileOpen(false)}
                  data-tooltip={item.label}
                >
                  <span className="sidebar__active-bar" aria-hidden="true" />
                  <span className="sidebar__icon">{icons[item.icon]}</span>
                  {!collapsed && <span className="sidebar__label">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        <button
          className="sidebar__collapse-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <span className={collapsed ? "is-flipped" : ""}>{icons.collapse}</span>
        </button>

        {/* User block + logout */}
        <div className="sidebar__footer">
          <div className="sidebar__user" data-tooltip={`${userName} · ${roleLabel[role] || role}`}>
            <span className="sidebar__avatar">{getInitials(userName)}</span>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{userName}</span>
                <span className="sidebar__role-badge">{roleLabel[role] || role}</span>
              </div>
            )}
          </div>

          <button
            className="sidebar__logout"
            onClick={handleLogout}
            disabled={loggingOut}
            data-tooltip="Log out"
          >
            <span className="sidebar__icon">
              {loggingOut ? <span className="sidebar__spinner" /> : icons.logout}
            </span>
            {!collapsed && <span className="sidebar__label">{loggingOut ? "Logging out…" : "Log Out"}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

/* ── Layout wrapper ───────────────────────────────────
   Drop this in place of your old DashboardLayout, or
   import Sidebar directly into your existing layout.   */
const DashboardLayout = ({ role, userName }) => (
  <div className="app-shell">
    <Sidebar role={role} userName={userName} />
    <main className="app-shell__main">
      <Outlet />
    </main>
  </div>
);

export default Sidebar;
export { DashboardLayout };
