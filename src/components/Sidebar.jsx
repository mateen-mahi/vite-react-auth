import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiHome,
  FiBookOpen,
  FiAward,
  FiUser,
  FiSettings,
} from "react-icons/fi";

import "../styles/Sidebar.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth > 768);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}

      <button
        className={`menu-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar */}

      <aside className={`sidebar ${isOpen ? "show" : ""}`}>
        <div className="logo">
          <h2>Academy</h2>
        </div>

        <nav className="nav-links">
          <NavLink to="/dashboard" onClick={closeSidebar}>
            <FiHome />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/lectures" onClick={closeSidebar}>
            <FiBookOpen />
            <span>Lectures</span>
          </NavLink>

          <NavLink to="/grand-quiz" onClick={closeSidebar}>
            <FiAward />
            <span>Grand Quiz</span>
          </NavLink>

          <NavLink to="/profile" onClick={closeSidebar}>
            <FiUser />
            <span>Profile</span>
          </NavLink>

          <NavLink to="/settings" onClick={closeSidebar}>
            <FiSettings />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <small>© 2026 Academy</small>
        </div>
      </aside>

      {isOpen && window.innerWidth <= 768 && (
        <div
          className="overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}