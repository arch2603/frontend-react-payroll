import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function readRoleFromToken(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return payload?.role ?? null; // must be set by your backend when signing
  } catch {
    return null;
  }
}


const ProtectedRoute = ({ roles, children }) => {
  const { auth } = useAuth();
  const location = useLocation();

  const token = auth?.token || localStorage.getItem("token");
  let role = auth?.role || localStorage.getItem("role");


  if (!role && token) role = readRoleFromToken(token);

  // Normalize
  const normalizedRole = (role || "").trim().toLowerCase();
  const requiredRoles = Array.isArray(roles) ? roles.map(r => r.toLowerCase()) : null;

  console.log("[ProtectedRoute Debug] required roles:", requiredRoles);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(normalizedRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  //   // TEMP debug (remove when fixed)
  //   return (
  //     <div className="p-6 space-y-2">
  //       <div className="font-semibold">Access denied. Admins only.</div>
  //       <div className="text-sm opacity-70">
  //         Debug → role: <code>{String(role)}</code> (normalized: <code>{normalizedRole}</code>), required: <code>{JSON.stringify(needed)}</code>
  //       </div>
  //     </div>
  //   );
  return children ?? <Outlet />;

  //if (!auth) return <Navigate to="login" state={{ from: location }} replace/>;
  //if (roles && !roles.includes(auth.role)) return <Navigate to="/dashboard" replace/>;
}

export default ProtectedRoute;

