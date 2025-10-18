import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Menu } from "lucide-react";
import { useEffect, useState, useRef } from "react";


export default function Header({ onMenuClick }) {
  const { auth, login, logout } = useAuth();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {

    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  function handleMenuKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  }

  function handleMouseEnter() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setOpen(true);
  }
  function handleMouseLeave() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setOpen(false), 200); // 👈 delayed close
  }

  return (
    <header className="sticky top-0 z-30 w-full items-center bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3 overflow-visible">
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

            <div
              ref={menuRef}
              className="relative pb-2"
              onMouseEnter={handleMouseEnter}   // optional: keep open on hover
              onMouseLeave={handleMouseLeave}  // optional: close when leaving
            >
              <button
                type="button"
                className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => {
                  console.log("open->", !open);
                   if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                  setOpen((v) => !v);
                }}
                onKeyDown={handleMenuKeyDown}
              >
                {auth.user?.name ?? "User"} · {auth.role ?? "guest"}
              </button>
              <div
                // Always render; hide/show via CSS to avoid remount flickers
                role="menu"
                className={`absolute right-0 top-full mt-2 w-48 rounded-md border 
                  dark:border-gray-700 bg-white dark:bg-gray-800 
                  shadow-lg z-[9999] ${open ? "block" : "hidden"
                  }`}
              >
                <button
                  role="menuitem"
                  onClick={() => { setOpen(false); navigate("/profile"); }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  Profile
                </button>
                <button
                  role="menuitem"
                  onClick={() => { setOpen(false); logout(); }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-red-600"
                >
                  Logout
                </button>

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
