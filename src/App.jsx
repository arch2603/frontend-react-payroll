import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import {lazy, Suspense} from 'react';
import {AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

const  Dashboard      = lazy( () => import("./pages/Dashboard"));
const  Employee     = lazy( () => import("./pages/Employee"));
const  Login          = lazy( () => import("./pages/Login"));
const  Payslip        = lazy( () =>import("./pages/Payslip"));
const  Leaves         = lazy( () => import("./pages/Leaves"));
const  Deductions     = lazy( () => import("./pages/Deductions"));
const  Admin          = lazy( () => import("./pages/AdminDashboard"));
const NotFound        = lazy( () => import("./pages/NotFound") )


const PrivateRoute = ({ children }) => {
  const { auth } = useAuth();
  return auth ? children : <Navigate to="/login" replace />;
};

function Fallback() {
  return (
    <div className="p-6 text-sm opacity-80">Loading…</div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
       
          {/* Main layout (Header + Content) */}
          <div className="flex flex-col flex-1">
              <Suspense fallback={<Fallback />}>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/employee" element={<Employee />} />
                      <Route path="/payslip" element={<Payslip />} />
                      <Route path="/leaves" element={<Leaves />} />
                      <Route path="/deductions" element={<Deductions />} />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute roles={["admin"]}>
                            <Admin />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                   
                </Routes>
                </Suspense>
            </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
