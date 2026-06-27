import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiMenu,
  FiX,
  FiHome,
  FiBookOpen,
  FiAward,
  FiUser,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

import "../styles/Sidebar.css";

const user = useAuth();


export default function Sidebar({ isOpen, setIsOpen, isMobile }) {

  const closeSidebar = () => {
    if (isMobile) setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`menu-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "expanded" : "collapsed"}`}>

        {/* Logo */}
        <div className="logo">
          <span className="logo-icon">🎓</span>
          {isOpen && <h2 className="logo-text">Academy</h2>}
        </div>

        {/* Nav Links */}
        <nav className="nav-links">
          <NavLink to="/dashboard" onClick={closeSidebar} title="Dashboard">
            <FiHome className="nav-icon" />
            {isOpen && <span>Dashboard</span>}
          </NavLink>

          <NavLink to="/lectures" onClick={closeSidebar} title="Lectures">
            <FiBookOpen className="nav-icon" />
            {isOpen && <span>Lectures</span>}
          </NavLink>

          <NavLink to="/grand-quiz" onClick={closeSidebar} title="Grand Quiz">
            <FiAward className="nav-icon" />
            {isOpen && <span>Grand Quiz</span>}
          </NavLink>

          <NavLink to="/profile" onClick={closeSidebar} title="Profile">
            <FiUser className="nav-icon" />
            {isOpen && <span>Profile</span>}
          </NavLink>

          <NavLink to="/settings" onClick={closeSidebar} title="Settings">
            <FiSettings className="nav-icon" />
            {isOpen && <span>Settings</span>}
          </NavLink>
        </nav>

        {/* User Footer */}
        <div className="sidebar-user">
          <div className="user-avatar">{user?.username?.charAt(0)?.toUpperCase() || "U"}</div>

          {isOpen && (
            <div className="user-info">
              <p className="user-name">{user?.username}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          )}

          <button
            className="logout-btn"
            onClick={() => console.log("Logout")}
            title="Log out"
          >
            <FiLogOut />
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div className="overlay" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}