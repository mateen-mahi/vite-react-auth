import { useState } from "react";
import {
  FiGrid, FiUsers, FiBookOpen, FiPlayCircle, FiHelpCircle, FiMessageSquare,
  FiActivity, FiAlertTriangle, FiBell, FiCpu,
} from "react-icons/fi";
import KpiCards from "../../components/Admin/KpiCards";
import ProgressAnalyticsCards from "../../components/Admin/ProgressAnalyticsCards";
import UserTable from "../../components/Admin/UserTable";
import CourseTable from "../../components/Admin/CourseTable";
import LectureTable from "../../components/Admin/LectureTable";
import QuizTable from "../../components/Admin/QuizTable";
import ComplaintQueue from "../../components/Admin/ComplaintQueue";
import LiveActivityPanel from "../../components/Admin/LiveActivityPanel";
import DangerZonePanel from "../../components/Admin/DangerZonePanel";
import NotificationsPage from "../../components/Admin/NotificationsPage";
import SystemUsagePanel from "../../components/Admin/SystemUsagePanel";
import ManagementShortcuts from "../../components/Admin/ManagementShortcuts";
import {
  SignupTrendChart, RoleDistributionChart, CategoryDistributionChart, ComplaintStatusChart,
} from "../../components/Admin/AdminCharts";
import "../../styles/admin-dashboard.css";

const TABS = [
  { id: "overview",      label: "Overview",       icon: FiGrid },
  { id: "users",         label: "Users",          icon: FiUsers },
  { id: "courses",       label: "Courses",        icon: FiBookOpen },
  { id: "lectures",      label: "Lectures",       icon: FiPlayCircle },
  { id: "quizzes",       label: "Quizzes",        icon: FiHelpCircle },
  { id: "complaints",    label: "Complaints",     icon: FiMessageSquare },
  { id: "activity",      label: "Live Activity",  icon: FiActivity },
  { id: "notifications", label: "Notifications",  icon: FiBell },
  { id: "system",        label: "System Usage",   icon: FiCpu },
  { id: "danger",        label: "Danger Zone",    icon: FiAlertTriangle },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="admin-dash-page">
      <div className="admin-dash-inner">

        <div className="admin-dash-header">
          <div>
            <h1 className="admin-dash-title">Admin Dashboard</h1>

            <p className="admin-dash-sub">
              Live data — Users, Courses, and Complaints tables plus the KPI
              cards update in real time as things happen. Charts below still
              use sample data (see chat notes).
            </p>
          </div>
        </div>

        <div className="admin-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`admin-tab ${
                activeTab === id ? "active" : ""
              } ${
                id === "danger" ? "admin-tab-danger" : ""
              }`}
              onClick={() => setActiveTab(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="admin-dash-content">
          {activeTab === "overview" && (
            <>
              <KpiCards />
              <ProgressAnalyticsCards />
              <ManagementShortcuts />

              <div className="admin-charts-grid">
                <SignupTrendChart />
                <RoleDistributionChart />
                <CategoryDistributionChart />
                <ComplaintStatusChart />
              </div>
            </>
          )}

          {activeTab === "users" && <UserTable />}
          {activeTab === "courses" && <CourseTable />}
          {activeTab === "lectures" && <LectureTable />}
          {activeTab === "quizzes" && <QuizTable />}
          {activeTab === "complaints" && <ComplaintQueue />}
          {activeTab === "activity" && <LiveActivityPanel />}
          {activeTab === "notifications" && <NotificationsPage />}
          {activeTab === "system" && <SystemUsagePanel />}
          {activeTab === "danger" && <DangerZonePanel />}
        </div>

      </div>
    </div>
  );
}