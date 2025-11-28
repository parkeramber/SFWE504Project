import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./auth/AuthPage";
import Dashboard from "./routes/Dashboard";
import ProfilePage from "./routes/Profile";
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
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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
        <Route path="/AdminReports" element={<AdminReports></AdminReports>} />
        <Route path="/ApplicationCreationGUI" element={<ApplicationCreationGUI></ApplicationCreationGUI>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
