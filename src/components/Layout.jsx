import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/Sidebar.css";

export default function Layout() {
  return (
    <div className="layout">
      <Sidebar />

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}