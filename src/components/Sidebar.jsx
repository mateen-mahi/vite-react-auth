import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SideBarContext";
import "../styles/SidebarandLayout.css";

const NAV_ITEMS = [
  {
    section: "General",
    items: [
      { label: "Dashboard",  path: "/dashboard",  roles: ["user", "admin", "super-admin"] },
      { label: "Lectures",   path: "/lectures",   roles: ["user", "admin", "super-admin"] },
      { label: "Grand Quiz", path: "/grand-quiz", roles: ["user", "admin", "super-admin"] },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "User Management", path: "/user-management", roles: ["admin", "super-admin"] },
      { label: "Admin Panel",     path: "/admin",           roles: ["admin", "super-admin"] },
    ],
  },
  {
    section: "Super Admin",
    items: [
      { label: "Payment Gateway", path: "/payment-gateway", roles: ["super-admin"] },
    ],
  },
];

export default function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role || "user";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? "visible" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>

        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">🎓</span>
            <span className="sidebar-logo-text">EduPlatform</span>
          </div>
          <button className="sidebar-toggle" onClick={() => setCollapsed((p) => !p)}>
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => {
            const visible = section.items.filter((i) => i.roles.includes(userRole));
            if (!visible.length) return null;
            return (
              <div className="nav-section" key={section.section}>
                <p className="nav-section-label">{section.section}</p>
                {visible.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                  >
                    <span className="nav-item-label">{item.label}</span>
                    <span className="tooltip">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-avatar">{initials(user?.name)}</div>
          <div className="user-info">
            <p className="user-name">{user?.name || "User"}</p>
            <p className="user-role">{userRole}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>↩</button>
        </div>

      </aside>
    </>
  );
}