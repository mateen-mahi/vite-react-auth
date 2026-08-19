import { useState } from "react";
import {
  FiGrid, FiUsers, FiBookOpen, FiPlayCircle, FiHelpCircle, FiMessageSquare,
  FiActivity, FiAlertTriangle, FiBell, FiCpu,
} from "react-icons/fi";
import { useDashboardStats } from "../../custom-hooks/useDashboardStats";
import KpiCards from "../../components/Admin/KpiCards";
import RevenueOverview from "../../components/Admin/RevenueOverview";
import AudienceBreakdown from "../../components/Admin/AudienceBreakdown";
import TopCoursesLeaderboard from "../../components/Admin/TopCoursesLeaderboard";
import ComplaintsInsights from "../../components/Admin/ComplaintsInsights";
import ProgressAnalyticsCards from "../../components/Admin/ProgressAnalyticsCards";
import LiveActivityPanel from "../../components/Admin/LiveActivityPanel";
import DangerZonePanel from "../../components/Admin/DangerZonePanel";
import NotificationsPage from "../../components/Admin/NotificationsPage";
import SystemUsagePanel from "../../components/Admin/SystemUsagePanel";
import ManagementShortcuts from "../../components/Admin/ManagementShortcuts";
import { SignupTrendChart } from "../../components/Admin/AdminCharts";
import "../../styles/admin-dashboard.css";

const TABS = [
  { id: "overview",      label: "Overview",       icon: FiGrid },
  { id: "activity",      label: "Live Activity",  icon: FiActivity },
  { id: "notifications", label: "Notifications",  icon: FiBell },
  { id: "system",        label: "System Usage",   icon: FiCpu },
  { id: "danger",        label: "Danger Zone",    icon: FiAlertTriangle },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Single fetch + socket subscription for the whole Overview tab — every
  // panel below reads from this instead of hitting the API independently,
  // so all the numbers on screen are always in sync with each other.
  const { stats, loading, onlineAdmins } = useDashboardStats();

  return (
    <div className="admin-dash-page">
      <div className="admin-dash-header">
        <div>
          <h1 className="admin-dash-title">Admin Dashboard</h1>
          <p className="admin-dash-sub">
            Live data across the platform — updates in real time as things happen.
          </p>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`admin-tab ${activeTab === id ? "active" : ""} ${id === "danger" ? "admin-tab-danger" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon /> <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="admin-dash-content">
        {activeTab === "overview" && (
          <>
            <KpiCards stats={stats} loading={loading} onlineAdmins={onlineAdmins} />

            <div className="admin-overview-row">
              <RevenueOverview stats={stats} loading={loading} />
              <ComplaintsInsights stats={stats} loading={loading} />
            </div>

            <div className="admin-overview-row">
              <TopCoursesLeaderboard stats={stats} loading={loading} />
              <ProgressAnalyticsCards />
            </div>

            <ManagementShortcuts />

            <div className="admin-charts-grid">
              <SignupTrendChart stats={stats} loading={loading} />
              <AudienceBreakdown stats={stats} loading={loading} />
            </div>
          </>
        )}
        {activeTab === "activity"      && <LiveActivityPanel />}
        {activeTab === "notifications" && <NotificationsPage />}
        {activeTab === "system"        && <SystemUsagePanel />}
        {activeTab === "danger"        && <DangerZonePanel />}
      </div>
    </div>
  );
}