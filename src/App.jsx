import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GuestRoute, ProtectedRoute, RoleRoute } from "./routes/RouteGuards";
import Sidebar from "./components/Sidebar"; // Direct import

// Pages
import Signup          from "./pages/Signup";
import Signin          from "./pages/Signin";
import OtpVerification from "./pages/OtpVerification";
import ForgotPassword  from "./pages/Forgot-password";
import ResetPassword   from "./pages/Reset-password";
import VerifyUserMail  from "./pages/VerifyUserMail";
import Dashboard       from "./pages/Dashboard";
import LectureWatching from "./pages/LectureWatching";
import GrandQuiz       from "./pages/GrandQuiz";
import UserManagement  from "./pages/admin/UserManagement";
import Admin           from "./pages/Admin";
import PaymentGateway  from "./pages/superAdmin/PaymentGateway";
import Unauthorized    from "./pages/Unauthorized";
import Error404Page    from "./pages/Error404page";

const PAGE_TITLES = {
  "/dashboard":       "Dashboard",
  "/lectures":        "Lectures",
  "/grand-quiz":      "Grand Quiz",
  "/user-management": "User Management",
  "/admin":           "Admin Panel",
  "/payment-gateway": "Payment Gateway",
};

// YEH HAI AAPKA LAYOUT CONTAINER (Ab yeh koi alag file nahi hai, isi file ka hissa hai)
function AppLayoutWrapper() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-layout">
      {/* State direct props ke zariye pass ho rahi hai, koi context nahi chahiye */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />
      
      <div className={`main-content ${collapsed ? "sidebar-collapsed" : ""}`}>
        <header className="topbar">
          <button className="topbar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
          <span className="topbar-title">{PAGE_TITLES[location.pathname] || "App"}</span>
        </header>

        <main className="page-content">
          {/* Outlet ka matlab hai ke niche wale saare pages is jagah khulenge */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Guest Pages (No Sidebar) */}
          <Route element={<GuestRoute />}>
            <Route path="/login"                 element={<Signin />} />
            <Route path="/signup"                element={<Signup />} />
            <Route path="/verify-user-mail"      element={<VerifyUserMail />} />
            <Route path="/verify-otp"            element={<OtpVerification />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* Protected Pages (With Sidebar Layout Wrapper) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayoutWrapper />}> {/* Humne custom wrapper yahan laga diya */}
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/lectures"   element={<LectureWatching />} />
              <Route path="/grand-quiz" element={<GrandQuiz />} />

              {/* Admin Pages */}
              <Route element={<RoleRoute allowedRoles={["admin", "super-admin"]} />}>
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/admin"           element={<Admin />} />
              </Route>

              {/* Super Admin Pages */}
              <Route element={<RoleRoute allowedRoles={["super-admin"]} />}>
                <Route path="/payment-gateway" element={<PaymentGateway />} />
              </Route>
            </Route>
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*"             element={<Error404Page />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
