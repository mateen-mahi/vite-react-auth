import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GuestRoute, ProtectedRoute, RoleRoute } from "./routes/RouteGuards";
import Layout from "./components/Layout";
// Pages
import Signup          from "./pages/Signup";
import Signin          from "./pages/Signin";
import OtpVerification from "./pages/OtpVerification";
import ForgotPassword  from "./pages/Forgot-password";
import ResetPassword   from "./pages/Reset-password";
import VerifyUserMail  from "./pages/VerifyUserMail";
import Dashboard       from "./pages/Dashboard";
import LectureWatching from "./pages/LectureWatching";
import UserManagement  from "./pages/admin/UserManagement";
import Admin           from "./pages/Admin";
import PaymentGateway  from "./pages/PaymentGateway";
import LectureAndQuizContainer from './pages/LectureAndQuizContainer';
import Unauthorized    from "./pages/Unauthorized";
import Error404Page    from "./pages/Error404page";
import GrandQuiz from "./pages/QuizPage";
import Profile from "./pages/Profile";
import Notes from "./pages/Notes";
import Courses from "./pages/Courses";
import Certificate from "./pages/Certificate";
import Complaints from "./pages/Complaints";
import SocketTestPage from "./pages/SocketTesting";


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
{/* Protected Routes */}

<Route element={<ProtectedRoute />}>
  <Route element={<Layout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/activities/:courseId"/>
    <Route path="/lectures/:courseId" element={<LectureWatching />} />
    <Route path="/grand-quiz/:courseId" element={<GrandQuiz />} />
    <Route path="/socket-test" element={<SocketTestPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/notes" element={<Notes />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/certificate" element={<Certificate />} />
      <Route path="/complaints" element={<Complaints />} />
    


    <Route element={<RoleRoute allowedRoles={["admin", "super-admin"]} />}>
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/admin" element={<Admin />} />
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