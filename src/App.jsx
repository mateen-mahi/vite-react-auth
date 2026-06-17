import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

// Auth Pages
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import OtpVerification from "./pages/OtpVerification";
import ForgotPassword from "./pages/Forgot-password";
import ResetPassword from "./pages/Reset-password";
import Error404Page from "./pages/Error404page";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import LectureWatching from "./pages/LectureWatching";
import GrandQuiz from "./pages/GrandQuiz";
import Unauthorized from "./pages/Unauthorized";
import UserManagement from "./pages/admin/UserManagement";
import PaymentGateway from "./pages/superAdmin/PaymentGateway";

// ─────────────────────────────────────────────
// useAuth Hook — fetches current user + role
// ─────────────────────────────────────────────
const useAuth = () => {
  const [auth, setAuth] = useState({ loading: true, user: null, role: null });

  useEffect(() => {
    axios
      .get("/check-auth", { withCredentials: true })
      .then((res) => {
        setAuth({
          loading: false,
          user: res.data.user,
          role: res.data.user?.role || null, // expected: "end-user" | "admin" | "super-admin"
        });
      })
      .catch(() => setAuth({ loading: false, user: null, role: null }));
  }, []);

  return auth;
};

// ─────────────────────────────────────────────
// Role → dashboard redirect path
// ─────────────────────────────────────────────
const dashboardPath = (role) => {
  if (role === "super-admin") return "/dashboard";
  if (role === "admin") return "/dashboard";
  return "/dashboard";
};

// ─────────────────────────────────────────────
// GuestRoute — redirects logged-in users away from /login & /signup
// ─────────────────────────────────────────────
const GuestRoute = () => {
  const { loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role) return <Navigate to={dashboardPath(role)} replace />;
  return <Outlet />;
};

// ─────────────────────────────────────────────
// ProtectedRoute — any authenticated user
// ─────────────────────────────────────────────
const ProtectedRoute = () => {
  const { loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!role) return <Navigate to="/login" replace />;
  return <DashboardLayout role={role} />;
};

// ─────────────────────────────────────────────
// RoleRoute — restricts by allowed roles
// ─────────────────────────────────────────────
const RoleRoute = ({ allowedRoles }) => {
  const { loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

// ─────────────────────────────────────────────
// Loading Screen
// ─────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100vh", fontFamily: "sans-serif", color: "#6b7280"
  }}>
    Loading...
  </div>
);

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Guest-only routes (redirect if already logged in) */}
        <Route element={<GuestRoute />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Signin />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Protected routes — all authenticated users */}
        <Route element={<ProtectedRoute />}>

          {/* Shared — end-user, admin, super-admin */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lectures" element={<LectureWatching />} />
          <Route path="/grand-quiz" element={<GrandQuiz />} />

          {/* Admin + Super Admin only */}
          <Route element={<RoleRoute allowedRoles={["admin", "super-admin"]} />}>
            <Route path="/user-management" element={<UserManagement />} />
          </Route>

          {/* Super Admin only */}
          <Route element={<RoleRoute allowedRoles={["super-admin"]} />}>
            <Route path="/payment-gateway" element={<PaymentGateway />} />
          </Route>

        </Route>

        {/* Misc */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Error404Page />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;