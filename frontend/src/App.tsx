import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MyReportsPage } from "./pages/MyReportsPage";
import { ReportFormPage } from "./pages/ReportFormPage";
import { TeamDashboardPage } from "./pages/TeamDashboardPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/reports" element={<MyReportsPage />} />
              <Route path="/reports/new" element={<ReportFormPage />} />
              <Route path="/reports/:reportId/edit" element={<ReportFormPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["manager", "admin"]} />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<TeamDashboardPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/reports" replace />} />
          <Route path="*" element={<Navigate to="/reports" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;