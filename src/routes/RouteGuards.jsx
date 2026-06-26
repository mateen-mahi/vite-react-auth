import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen"; // <-- Semicolon fix kiya

const getDashboardPath = (role) => {
  switch (role) {
    case "student":
      return "/dashboard";
    case "admin":
      return "/admin";
    case "super-admin":
      return "/payment-gateway";
    default:
      return "/login";
  }
};

export const GuestRoute = () => {
  const { loading, role } = useAuth();

  if (loading) return <LoadingScreen />;

  // Agar user already logged in hai (role exist karta hai) to use uske dashboard bhejo
  if (role) {
    return <Navigate to={getDashboardPath(role)} replace />; // <-- role pass kiya
  }

  return <Outlet />;
};

export const ProtectedRoute = () => {
  const { loading, role } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const RoleRoute = ({ allowedRoles }) => {
  const { loading, role } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
