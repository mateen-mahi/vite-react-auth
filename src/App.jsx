import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import {
  GuestRoute,
  ProtectedRoute,
  RoleRoute,
} from "./routes/RouteGuards";

import Layout from "./components/Layout";

import Signup          from "./pages/Signup";
import Signin          from "./pages/Signin";
import OtpVerification from "./pages/OtpVerification";
import ForgotPassword  from "./pages/Forgot-password";
import ResetPassword   from "./pages/Reset-password";
import Error404Page    from "./pages/Error404page";
import Dashboard       from "./pages/Dashboard";
import LectureWatching from "./pages/LectureWatching";
import VerifyUserMail  from "./pages/VerifyUserMail";
import GrandQuiz       from "./pages/GrandQuiz";
import Unauthorized    from "./pages/Unauthorized";
import UserManagement  from "./pages/admin/UserManagement";
import PaymentGateway  from "./pages/superAdmin/PaymentGateway";
import Admin           from "./pages/Admin";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Guest Routes (no sidebar) ── */}
          <Route element={<GuestRoute />}>
            <Route path="/signup"                element={<Signup />} />
            <Route path="/login"                 element={<Signin />} />
            <Route path="/verify-user-mail"      element={<VerifyUserMail />} />
            <Route path="/verify-otp"            element={<OtpVerification />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* ── Protected Routes (with sidebar via Layout) ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"  element={<Layout><Dashboard /></Layout>} />
            <Route path="/lectures"   element={<Layout><LectureWatching /></Layout>} />
            <Route path="/grand-quiz" element={<Layout><GrandQuiz /></Layout>} />

            {/* Admin + Super-Admin */}
            <Route element={<RoleRoute allowedRoles={["admin", "super-admin"]} />}>
              <Route path="/user-management" element={<Layout><UserManagement /></Layout>} />
              <Route path="/admin"           element={<Layout><Admin /></Layout>} />
            </Route>

            {/* Super-Admin only */}
            <Route element={<RoleRoute allowedRoles={["super-admin"]} />}>
              <Route path="/payment-gateway" element={<Layout><PaymentGateway /></Layout>} />
            </Route>
          </Route>

          {/* ── No sidebar ── */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*"             element={<Error404Page />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;