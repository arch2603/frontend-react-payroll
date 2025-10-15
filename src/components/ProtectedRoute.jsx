import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ roles, children }) => {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth) return <Navigate to="login" state={{ from: location }} replace/>;
  if (roles && !roles.includes(auth.role)) return <Navigate to="/dashboard" replace/>;

  return children;
};

export default ProtectedRoute;

