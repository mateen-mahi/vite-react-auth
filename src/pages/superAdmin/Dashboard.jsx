import { useState } from "react";
import {
  FiGrid, FiUsers, FiBookOpen, FiPlayCircle, FiHelpCircle, FiMessageSquare, FiActivity,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import KpiCards from "../../components/Admin/KpiCards";
import UserTable from "../../components/Admin/UserTable";
import CourseTable from "../../components/Admin/CourseTable";
import LectureTable from "../../components/Admin/LectureTable";
import QuizTable from "../../components/Admin/QuizTable";
import ComplaintQueue from "../../components/Admin/ComplaintQueue";
import LiveActivityPanel from "../../components/Admin/LiveActivityPanel";
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
  // Ensure your AuthContext explicitly provisions this property variable
  const { isConnected } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

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

      {/* Tabs Navigation Control */}
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

      {/* 
        FIX: Render tab layers inside hidden wrappers. 
        This keeps component states (like text inputs, sorting states, and table page indices) alive.
      */}
      <div className="admin-dash-content">
        <div style={{ display: activeTab === "overview" ? "block" : "none" }}>
          <KpiCards onlineCount={onlineCount} />
          <div className="admin-charts-grid">
            <SignupTrendChart />
            <RoleDistributionChart />
            <CategoryDistributionChart />
            <ComplaintStatusChart />
          </div>
        </div>

        <div style={{ display: activeTab === "users" ? "block" : "none" }}>
          <UserTable />
        </div>

        <div style={{ display: activeTab === "courses" ? "block" : "none" }}>
          <CourseTable />
        </div>

        <div style={{ display: activeTab === "lectures" ? "block" : "none" }}>
          <LectureTable />
        </div>

        <div style={{ display: activeTab === "quizzes" ? "block" : "none" }}>
          <QuizTable />
        </div>

        <div style={{ display: activeTab === "complaints" ? "block" : "none" }}>
          <ComplaintQueue />
        </div>

        <div style={{ display: activeTab === "activity" ? "block" : "none" }}>
          <LiveActivityPanel />
        </div>
      </div>
    </div>
  );
}
