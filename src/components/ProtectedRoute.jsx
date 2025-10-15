import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ roles, children }) => {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="login" replace/>;
  if (roles && !roles.includes(auth.role)) return <Navigate to="/dashboard" replace/>;

  return children;
};

export default ProtectedRoute;

