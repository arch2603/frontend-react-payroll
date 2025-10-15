import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Menu } from "lucide-react";
import { useEffect, useState } from "react";


export default function Header({ onMenuClick }) {
  const { auth, login, logout } = useAuth();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const navigate = useNavigate();
  
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 w-full items-center bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3 shadow">
        <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold">Payroll System</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
              onClick={() => setDark((v) => !v)}
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {auth ? (
              <div className="relative group">
                <button className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm">
                  {auth.user?.name ?? "User"} · {auth.role ?? "guest"}
                </button>
                <div className="absolute right-0 mt-2 w-40 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                  <button onClick={() => navigate("/profile")} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Profile</button>
                  <button onClick={logout} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-red-600">Logout</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Login
              </button>
            )}
          </div>
      </div>
    </header>
  );
}
