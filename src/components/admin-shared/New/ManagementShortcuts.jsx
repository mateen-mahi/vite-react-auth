import { useNavigate } from "react-router-dom";
import {
  FiUsers, FiBookOpen, FiMessageSquare, FiPlayCircle,
  FiHelpCircle, FiFileText, FiAward,
} from "react-icons/fi";
import "../../styles/management-shortcuts.css";

const SHORTCUTS = [
  { label: "User Management",        icon: FiUsers,        path: "/admin/user-management" },
  { label: "Course Management",      icon: FiBookOpen,     path: "/admin/courses" },
  { label: "Complaint Management",   icon: FiMessageSquare,path: "/admin/complaints" },
  { label: "Lecture Management",     icon: FiPlayCircle,   path: "/admin/lectures" },
  { label: "Quiz Management",        icon: FiHelpCircle,   path: "/admin/quizzes" },
  { label: "Notes Management",       icon: FiFileText,     path: "/admin/notes" },
  { label: "Certificate Management", icon: FiAward,        path: "/admin/certificates" },
];

export default function ManagementShortcuts() {
  const navigate = useNavigate();

  return (
    <div className="shortcuts-grid">
      {SHORTCUTS.map(({ label, icon: Icon, path }) => (
        <button
          key={path}
          className="shortcut-card"
          onClick={() => navigate(path)}
          type="button"
        >
          <span className="shortcut-icon">
            <Icon />
          </span>
          <span className="shortcut-label">{label}</span>
        </button>
      ))}
    </div>
  );
}