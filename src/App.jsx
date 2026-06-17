import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
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
import Admin from "./pages/Admin";

// 1. Create a Global Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ loading: true, user: null, role: null });

  useEffect(() => {
    axios
      .get("/check-auth", { withCredentials: true })
      .then((res) => {
        setAuth({
          loading: false,
          user: res.data.user,
          role: res.data.user?.role || null,
        });
      })
      .catch(() => setAuth({ loading: false, user: null, role: null }));
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// Hook to pull state safely without initiating new requests
const useAuth = () => useContext(AuthContext);

const dashboardPath = (role) => "/dashboard";

// 2. Optimized Route Wrappers
const GuestRoute = () => {
  const { loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role) return <Navigate to={dashboardPath(role)} replace />;
  return <Outlet />;
};

const ProtectedRoute = () => {
  const { loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!role) return <Navigate to="/login" replace />;
  return <DashboardLayout role={role} />;
};

const RoleRoute = ({ allowedRoles }) => {
  const { loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

const LoadingScreen = () => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100vh", fontFamily: "sans-serif", color: "#6b7280"
  }}>
    Loading...
  </div>
);

// 3. App component wrapped in AuthProvider
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Guest-only routes */}
          <Route element={<GuestRoute />}>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Signin />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* Protected layout wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lectures" element={<LectureWatching />} />
            <Route path="/grand-quiz" element={<GrandQuiz />} />

            {/* Nested Role Protections */}
            <Route element={<RoleRoute allowedRoles={["admin", "super-admin"]} />}>
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["super-admin"]} />}>
              <Route path="/payment-gateway" element={<PaymentGateway />} />
            </Route>
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Error404Page />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
