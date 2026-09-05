import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ roles, children }) => {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowed = Array.isArray(roles) ? roles.map(role => role.toLowerCase()) : null;
  if (allowed && !allowed.includes(auth.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
