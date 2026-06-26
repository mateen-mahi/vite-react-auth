import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingScreen = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontFamily: "sans-serif",
      color: "#6b7280",
    }}
  >
    Loading...
  </div>
);



const getDashboardPath = (role) => {
  switch (role) {
    case "student":
      return "/dashboard";

    case "admin":
      return "/admin";

    case "super-admin":
      return "/super-admin";

    default:
      return "/login";
  }
};


export const GuestRoute = () => {
  const { loading, role } = useAuth();

  if (loading) return <LoadingScreen />;

  if (role) {
    return <Navigate to={getDashboardPath()} replace />;
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

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};