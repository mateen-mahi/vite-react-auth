import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/SidebarandLayout.css";

const NAV_ITEMS = [
  { label: "Dashboard",       path: "/dashboard",       roles: ["student", "admin", "super-admin"] },
  { label: "Lectures",        path: "/lectures",        roles: ["student", "admin", "super-admin"] },
  { label: "Grand Quiz",      path: "/grand-quiz",      roles: ["student", "admin", "super-admin"] },
  { label: "User Management", path: "/user-management", roles: ["admin", "super-admin"] },
  { label: "Admin Panel",     path: "/admin",           roles: ["admin", "super-admin"] },
  { label: "Payment Gateway", path: "/payment-gateway", roles: ["super-admin"] },
];

// Hamein collapsed aur mobileOpen direct props se milenge
export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role || "student";
  console.log(user);
  

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await logout(); navigate("/login"); } catch { navigate("/login"); }
  };

  const initials = (name) => name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "ST";
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? "visible" : ""}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">🎓</span>
            {!collapsed && <span className="sidebar-logo-text">EduPlatform</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "→" : "←"}
          </button>
        </div>
        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <span className="nav-item-label">{item.label}</span>
              {collapsed && <span className="tooltip">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-avatar">{initials(user?.name)}</div>
          {!collapsed && (
            <div className="user-info">
              <p className="user-name">{user?.name || "Student"}</p>
              <p className="user-role">{userRole}</p>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>↩</button>
        </div>
      </aside>
    </>
  );
}
