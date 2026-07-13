import { useState } from "react";
import {
  FiGrid, FiUsers, FiBookOpen, FiPlayCircle, FiHelpCircle, FiMessageSquare, FiActivity,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import KpiCards from "../../components/admin/KpiCards";
import UserTable from "../../components/admin/UserTable";
import CourseTable from "../../components/admin/CourseTable";
import LectureTable from "../../components/admin/LectureTable";
import QuizTable from "../../components/admin/QuizTable";
import ComplaintQueue from "../../components/admin/ComplaintQueue";
import LiveActivityPanel from "../../components/admin/LiveActivityPanel";
import {
  SignupTrendChart, RoleDistributionChart, CategoryDistributionChart, ComplaintStatusChart,
} from "../../components/Admin/AdminCharts";
import "../../styles/admin-dashboard.css";

const TABS = [
  { id: "overview",   label: "Overview",      icon: FiGrid },
  { id: "users",      label: "Users",         icon: FiUsers },
  { id: "courses",    label: "Courses",       icon: FiBookOpen },
  { id: "lectures",   label: "Lectures",      icon: FiPlayCircle },
  { id: "quizzes",    label: "Quizzes",       icon: FiHelpCircle },
  { id: "complaints", label: "Complaints",    icon: FiMessageSquare },
  { id: "activity",   label: "Live Activity", icon: FiActivity },
];

export default function Dashboard() {
  const { isConnected } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Loosely reflects real connection state — see LiveActivityPanel for the
  // full note on what's real vs dummy in the online-count number.
  const onlineCount = isConnected ? 38 : 37;

  return (
    <div className="admin-dash-page">
      <div className="admin-dash-header">
        <div>
          <h1 className="admin-dash-title">Admin Dashboard</h1>
          <p className="admin-dash-sub">
            All data below is dummy — each file has a <code>TODO</code> marking exactly where to swap in a real API call.
          </p>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`admin-tab ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon /> <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="admin-dash-content">
        {activeTab === "overview" && (
          <>
            <KpiCards onlineCount={onlineCount} />
            <div className="admin-charts-grid">
              <SignupTrendChart />
              <RoleDistributionChart />
              <CategoryDistributionChart />
              <ComplaintStatusChart />
            </div>
          </>
        )}
        {activeTab === "users"      && <UserTable />}
        {activeTab === "courses"    && <CourseTable />}
        {activeTab === "lectures"   && <LectureTable />}
        {activeTab === "quizzes"    && <QuizTable />}
        {activeTab === "complaints" && <ComplaintQueue />}
        {activeTab === "activity"   && <LiveActivityPanel />}
      </div>
    </div>
  );
}
