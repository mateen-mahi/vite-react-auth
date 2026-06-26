import { useLocation, Outlet } from "react-router-dom"; // <-- Outlet import kiya
import { SidebarProvider, useSidebar } from "../context/SideBarContext";
import Sidebar from "./Sidebar";
import "../styles/SidebarandLayout.css";

const PAGE_TITLES = {
  "/dashboard":       "Dashboard",
  "/lectures":        "Lectures",
  "/grand-quiz":      "Grand Quiz",
  "/user-management": "User Management",
  "/admin":           "Admin Panel",
  "/payment-gateway": "Payment Gateway",
};

function LayoutInner({ children }) {
  const { collapsed, setMobileOpen } = useSidebar();
  const location = useLocation();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${collapsed ? "sidebar-collapsed" : ""}`}>
        <header className="topbar">
          <button className="topbar-mobile-toggle" onClick={() => setMobileOpen((p) => !p)}>☰</button>
          <span className="topbar-title">{PAGE_TITLES[location.pathname] || "App"}</span>
        </header>
        
        {/* Agar children pass hua hai to wo dikhao, nahi to React Router ka Outlet render karo */}
        <main className="page-content">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
