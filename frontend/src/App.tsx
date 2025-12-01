import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./auth/AuthPage";
import Dashboard from "./components/dashboard/Dashboard";   // ⬅ this one
import ProfilePage from "./routes/Profile";
import ApplicantOnboarding from "./routes/ApplicantOnboarding";
import AdminUsersPage from "./routes/AdminUsers";
import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/Navbar";
import AdminReports from "./routes/AdminReportsGUI";
import ApplicationCreationGUI from "./routes/ScholarshipCreateEditGUI";
import "./App.css";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<AuthPage defaultMode="login" />} />
        <Route path="/register" element={<AuthPage defaultMode="register" />} />
        <Route
          path="/applicant/onboarding"
          element={
            <ProtectedRoute>
              <ApplicantOnboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/myprofile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin-only pages */}
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scholarships"
          element={
            <ProtectedRoute>
              <ApplicationCreationGUI />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
