
import { useNavigate, useLocation } from "react-router-dom";
import { FiZap } from "react-icons/fi";
import "../styles/ChatbotLauncherButton.css";

export default function ChatbotLauncherButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith("/chatbot")) return null;

  return (
    <button
      className="cb-launcher-btn"
      onClick={() => navigate("/chatbot")}
      aria-label="Open AI Study Assistant"
      title="AI Study Assistant"
    >
      <FiZap />
    </button>
  );
}
