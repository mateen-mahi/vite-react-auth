import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GuestRoute, ProtectedRoute, RoleRoute } from "./routes/RouteGuards";
import Layout from "./components/Layout"
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* No sidebar */}
          <Route element={<GuestRoute />}>
            <Route path="/login"                 element={<Signin />} />
            <Route path="/signup"                element={<Signup />} />
            <Route path="/verify-user-mail"      element={<VerifyUserMail />} />
            <Route path="/verify-otp"            element={<OtpVerification />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* With sidebar */}
              <Route element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/lectures"   element={<LectureWatching />} />
            <Route path="/grand-quiz" element={<GrandQuiz />} />

            <Route element={<RoleRoute allowedRoles={["admin", "super-admin"]} />}>
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/admin"           element={<Admin />} />
            </Route>

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