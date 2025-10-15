// src/pages/NotFound.jsx
import { Link, useLocation } from "react-router-dom";

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="p-8 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-sm opacity-80 mb-6">
        We couldn’t find <code className="px-1 py-0.5 bg-gray-200/60 dark:bg-gray-700/60 rounded">{pathname}</code>.
      </p>
      <div className="flex gap-3">
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
        <Link
          to="/"
          className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
