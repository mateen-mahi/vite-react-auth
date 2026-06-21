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
import VerifyUserMail from "./pages/VerifyUserMail";
import GrandQuiz from "./pages/GrandQuiz";
import Unauthorized from "./pages/Unauthorized";
import UserManagement from "./pages/admin/UserManagement";
import PaymentGateway from "./pages/superAdmin/PaymentGateway";
import { DashboardLayout } from "./pages/Sidebar";
import Admin from "./pages/Admin";
import api from "./services/api";

// 1. Create a Global Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ loading: true, user: null, role: null });

  useEffect(() => {
    api
      .get("/check-auth", { withCredentials: true })
      .then((res) => {
        setAuth({
          loading: false,
          user: res.data.user,
          role: res.data.user?.role || null,
        });
      })
      .catch(() => {
        setAuth({ loading: false, user: null, role: null });
      });
  }, []);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to consume shared auth state cleanly
const useAuth = () => useContext(AuthContext);

// 2. Single Source Role Dashboard Traversal Path
const getDashboardPath = (role) => {
  return "/dashboard"; 
};

// 3. GuestRoute (No API call overhead anymore)
const GuestRoute = () => {
  const { loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role) return <Navigate to={getDashboardPath(role)} replace />;
  return <Outlet />;
};

// 4. ProtectedRoute Layout Wrapper
const ProtectedRoute = () => {
  const { loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!role) return <Navigate to="/login" replace />;
  return <DashboardLayout role={role} />;
};

// 5. Role Specific Access Guard
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root Entry */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Guest Public Scope */}
          <Route element={<GuestRoute />}>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Signin />} />
            <Route path="/verify-user-mail" element={<VerifyUserMail />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* Core Authenticated Scope */}
          <Route element={<ProtectedRoute />}>
            {/* Shared Route Tree */}
            <Route path="/sidebar" element={<Sidebar />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lectures" element={<LectureWatching />} />
            <Route path="/grand-quiz" element={<GrandQuiz />} />

            {/* Middle-tier Admin Authority Controls */}
            <Route element={<RoleRoute allowedRoles={["admin", "super-admin"]} />}>
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/admin" element={<Admin />} />
            </Route>

            {/* Root Super Admin Core Scope */}
            <Route element={<RoleRoute allowedRoles={["super-admin"]} />}>
              <Route path="/payment-gateway" element={<PaymentGateway />} />
            </Route>
          </Route>

          {/* Exception Handlers */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Error404Page />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
