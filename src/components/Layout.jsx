import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/SidebarandLayout.css";

/* ── Route → page title map ─────────────────────────────────── */
const PAGE_TITLES = {
  "/dashboard":       "Dashboard",
  "/lectures":        "Lectures",
  "/grand-quiz":      "Grand Quiz",
  "/user-management": "User Management",
  "/admin":           "Admin Panel",
  "/payment-gateway": "Payment Gateway",
};

/* ── Hamburger Icon ─────────────────────────────────────────── */
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6"  x2="21" y2="6"  />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/* ── Layout Component ───────────────────────────────────────── */
export default function Layout({ children }) {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] || "App";

  // Auto-reset collapse state on mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="app-layout">

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main area */}
      <div className={`main-content ${collapsed ? "sidebar-collapsed" : ""}`}>

        {/* Top bar */}
        <header className="topbar">
          <button
            className="topbar-mobile-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            title="Toggle menu"
          >
            <MenuIcon />
          </button>
          <span className="topbar-title">{pageTitle}</span>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>

      </div>
    </div>
  );
}