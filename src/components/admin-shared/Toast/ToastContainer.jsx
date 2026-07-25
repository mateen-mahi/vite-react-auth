import { useEffect, useState, useCallback } from "react";
import { FiCheckCircle, FiXCircle, FiInfo, FiX } from "react-icons/fi";
import { subscribeToast } from "./toast";
import "./Toast.css";

const ICONS = {
  success: <FiCheckCircle />,
  error: <FiXCircle />,
  info: <FiInfo />,
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToast(setToasts);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => remove(t.id), t.duration)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, remove]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span className="toast-icon">{ICONS[t.type] || ICONS.info}</span>
          <span className="toast-msg">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => remove(t.id)}
            aria-label="Dismiss"
          >
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
