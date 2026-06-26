import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SideBarContext";
import "../styles/SidebarandLayout.css";

const NAV_ITEMS = [
  {
    section: "General",
    items: [
      // "user" ko badal kar "student" kar diya taake RouteGuard se match kare
      { label: "Dashboard",  path: "/dashboard",  roles: ["student", "admin", "super-admin"] },
      { label: "Lectures",   path: "/lectures",   roles: ["student", "admin", "super-admin"] },
      { label: "Grand Quiz", path: "/grand-quiz", roles: ["student", "admin", "super-admin"] },
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

  // Default role ko bhi "student" kar diya
  const userRole = user?.role || "student";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]); // Dependency array warning fix ki

  const handleLogout = async () => {
    try {
      await logout(); // Agar logout api call karta hai to safe wrapper
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login"); // Fail hone par bhi user ko screen se hata dein
    }
  };

  const initials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "ST";

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
            {!collapsed && <span className="sidebar-logo-text">EduPlatform</span>}
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
                {!collapsed && <p className="nav-section-label">{section.section}</p>}
                {visible.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                  >
                    {/* Aap icons bhi add kar sakte hain visually anchors ke liye */}
                    <span className="nav-item-label">{item.label}</span>
                    {collapsed && <span className="tooltip">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-avatar">{initials(user?.name)}</div>
          {!collapsed && (
            <div className="user-info">
              <p className="user-name">{user?.name || "Student"}</p>
              <p className="user-role">{userRole}</p>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">↩</button>
        </div>

      </aside>
    </>
  );
}
