import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Users, FileText, Calendar, MinusSquare, Shield } from "lucide-react";

const Sidebar = ({ open, setOpen }) => {
  const { auth } = useAuth();
  const role = String(auth?.role ?? "").trim().toLowerCase();
  const canManage = role === "admin" || role === "hr";
  console.log("Sidebar.jsx line-9... role is" + role);
  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded mb-1 transition ${isActive
      ? "bg-blue-600 text-white"
      : "hover:bg-gray-200 dark:hover:bg-gray-700"
    }`;

  return (
    <>
      {/* Mobile drawer */}
      <aside className={`fixed z-50 inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4 md:hidden transform transition ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-lg">Payroll</div>
          <button onClick={() => setOpen(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">✕</button>
        </div>
        <nav className="space-y-1">
          <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}><LayoutDashboard className="h-4 w-4" /> Dashboard</NavLink>

          {canManage && (
            <NavLink to="/employees" className={linkClass} onClick={() => setOpen(false)}><Users className="h-4 w-4" /> Employees</NavLink>
          )}

          {canManage && (
            <NavLink to="/payslip" className={linkClass} onClick={() => setOpen(false)}><FileText className="h-4 w-4" /> Payslip</NavLink>
          )}

          {canManage && (
            <NavLink to="/leaves" className={linkClass} onClick={() => setOpen(false)}><Calendar className="h-4 w-4" /> Leaves</NavLink>
          )}

          {canManage && (
            <NavLink to="/deductions" className={linkClass} onClick={() => setOpen(false)}><MinusSquare className="h-4 w-4" /> Deductions</NavLink>
          )}

          {role === "admin" && <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}><Shield className="h-4 w-4" /> Admin</NavLink>}
        </nav>
      </aside>

      {/* Desktop rail */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
        <div className="flex flex-col w-full">
          <div className="h-14 px-4 border-b dark:border-gray-700 flex items-center font-semibold">Payroll</div>
          <nav className="flex-1 p-3 space-y-1">

            <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}><LayoutDashboard className="h-4 w-4" /> Dashboard</NavLink>

            {canManage && (
              <NavLink to="/employees" className={linkClass} onClick={() => setOpen(false)}><Users className="h-4 w-4" /> Employees</NavLink>
            )}

            {canManage && (
              <NavLink to="/payslip" className={linkClass} onClick={() => setOpen(false)}><FileText className="h-4 w-4" /> Payslip</NavLink>
            )}

            {canManage && (
              <NavLink to="/leaves" className={linkClass} onClick={() => setOpen(false)}><Calendar className="h-4 w-4" /> Leaves</NavLink>
            )}

            {canManage && (
              <NavLink to="/payroll/view" className={linkClass}><FileText className="h-4 w-4" />Payroll</NavLink>
            )}

            {canManage && (
              <NavLink to="/deductions" className={linkClass} onClick={() => setOpen(false)}><MinusSquare className="h-4 w-4" /> Deductions</NavLink>
            )}

            {role === "admin" && (
              <>
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-3 pt-3">Admin</div>
                <NavLink to="/admin" className={linkClass}><Shield className="h-4 w-4" /> Admin</NavLink>
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
