import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiBell, FiUser, FiLock, FiClock, FiLogOut } from "react-icons/fi";
import "../styles/Navbar.css";

export default function Navbar({ isOpen, isMobile }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const avatarLetter = user?.username?.charAt(0)?.toUpperCase() || "U";
  const sidebarExpanded = isOpen && !isMobile;

  return (
    <header
      className={`navbar ${sidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}
    >
      <div className="navbar-logo">
        <span className="navbar-logo-icon">🎓</span>
        <span className="navbar-logo-text">Academy</span>
      </div>

      <div className="navbar-actions">
        <button
          className="navbar-icon-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          <FiBell />
          <span className="navbar-badge">3</span>
        </button>

        <div className="navbar-avatar-wrapper" ref={dropdownRef}>
          <button
            className="navbar-avatar"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            {avatarLetter}
          </button>

          {dropdownOpen && (
            <div className="navbar-dropdown">
              <div className="dropdown-user-info">
                <div className="dropdown-avatar">{avatarLetter}</div>
                <div>
                  <p className="dropdown-username">
                    {user?.username || "User"}
                  </p>
                  <p className="dropdown-role">{user?.role || "student"}</p>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => handleNavigate("/profile")}
              >
                <FiUser className="dropdown-item-icon" /> My Profile
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleNavigate("/change-password")}
              >
                <FiLock className="dropdown-item-icon" /> Change Password
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleNavigate("/login-history")}
              >
                <FiClock className="dropdown-item-icon" /> Login History
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item dropdown-logout"
                onClick={handleLogout}
              >
                <FiLogOut className="dropdown-item-icon" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
