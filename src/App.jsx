import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AppErrorBoundary from "./components/AppErrorBoundary";

// You can lazy-load these too for consistency
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const PayRunCurrent = lazy(() => import("./pages/PayRunCurrent"));
const TimesheetsImport = lazy(() => import("./pages/TimesheetsImport"));
const History = lazy(() => import("./pages/History"));
const Login = lazy(() => import("./pages/Login"));
const Payslip = lazy(() => import("./pages/Payslip"));
const Leaves = lazy(() => import("./pages/Leaves"));
const Deductions = lazy(() => import("./pages/Deductions"));
const Admin = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PayrollView = lazy(() => import("./pages/PayrollView"));
const UserManagement = lazy(() => import("./pages/UserManagement"));

// Auth pages (keep as eager or lazy—your call)
const ChangePassword = lazy(() => import("./pages/auth/ChangePassword"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

function Fallback() {
  return <div className="p-6 text-sm opacity-80">Loading…</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <div className="flex flex-col flex-1">
            <AppErrorBoundary>
              <Suspense fallback={<Fallback />}>
                <Routes>

                  {/* Public */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Authenticated (everything inside uses the app chrome/Layout) */}
                  <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/payruns/current" element={<PayRunCurrent />} />
                    <Route path="/timesheets/import" element={<TimesheetsImport />} />
                    <Route path="/payslip" element={<Payslip />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/leaves" element={<Leaves />} />
                    <Route path="/deductions" element={<Deductions />} />
                    <Route path="/payroll/view" element={<PayrollView />} />

                    {/* Account */}
                    <Route path="/account/change-password" element={<ChangePassword />} />

                    <Route path="/account/reset-password" element={<ResetPassword />} />

                    {/* Admin-only */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <Admin />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute roles={["admin"]}>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 inside app chrome */}
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Catch-all (public) */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </AppErrorBoundary>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}