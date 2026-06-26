import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api"; // Aapka axios instance endpoint hit karne ke liye
import "../styles/SidebarandLayout.css";

const NAV_ITEMS = [
  { label: "Dashboard",       path: "/dashboard",       roles: ["student", "admin", "super-admin"] },
  { label: "Lectures",        path: "/lectures",        roles: ["student", "admin", "super-admin"] },
  { label: "Grand Quiz",      path: "/grand-quiz",      roles: ["student", "admin", "super-admin"] },
  { label: "User Management", path: "/user-management", roles: ["admin", "super-admin"] },
  { label: "Admin Panel",     path: "/admin",           roles: ["admin", "super-admin"] },
  { label: "Payment Gateway", path: "/payment-gateway", roles: ["super-admin"] },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, setAuth } = useAuth(); // setAuth ko useAuth se nikala state reset karne ke liye
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user?.role || "student";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const handleLogout = async () => {
    try {
      // Backend api endpoint call cookie / token ko clear karne ke liye
      await api.post("/signout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Backend logout clean up failed:", error);
    } finally {
      // Kuch bhi ho jaye, frontend state reset hogi aur user login page par jayega
      if (typeof setAuth === "function") {
        setAuth({ loading: false, user: null, role: null });
      }
      navigate("/login");
    }
  };

  // Initials generator strictly using user.username ("Mateen" -> "MA")
  const initials = (username) =>
    username ? username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "ST";

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const handleUserClickAction = () => {
    alert("User interaction triggered! Execution flow completed successfully.");
  };

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
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-item-label">{item.label}</span>
              {collapsed && <span className="tooltip">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer Area with dynamic profiles */}
        <div className="sidebar-footer">
          <div className="user-avatar">{initials(user?.username)}</div>
          {!collapsed && (
            <div className="user-info">
              {/* Console log variable "username" use kiya */}
              <p className="user-name">{user?.username || "Empty"}</p>
              <p className="user-role">{userRole}</p>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">↩</button>
        </div>

        {/* Extra Bottom Alert Button */}
        <div className="sidebar-action-container" style={{ padding: "10px", textAlign: "center" }}>
          <button 
            className="action-trigger-btn" 
            onClick={handleUserClickAction}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          >
            {collapsed ? "⚡" : "User Click Action"}
          </button>
        </div>

      </aside>
    </>
  );
}
