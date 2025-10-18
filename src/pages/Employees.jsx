import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// async function api(path, opts = {}) {
//   const token = localStorage.getItem("token");
//   const res = await fetch(`/api${path}`, {
//     ...opts,
//     headers: {
//       ...(opts.headers || {}),
//       Authorization: token ? `Bearer ${token}` : undefined,
//     },
//     credentials: "include",
//   });
//   if (!res.ok) throw new Error(`${opts.method || "GET"} ${path} ${res.status}`);
//   return res.json();
// }

async function api(path, opts = {}) {
  const token = localStorage.getItem("token");
  const url = `/api${path}`;

  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Accept": "application/json",
    },
    credentials: "include",
  });

  const text = await res.text(); // read once
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }

  if (!res.ok) {
    // Show everything to the console so we can see the real issue
    console.error("API ERROR:", {
      url,
      status: res.status,
      statusText: res.statusText,
      responseBody: json || text,
      headers: Object.fromEntries(res.headers.entries()),
    });
    const message = (json && (json.message || json.error)) || `${opts.method || "GET"} ${path} ${res.status}`;
    throw new Error(message);
  }

  // happy path
  return json;
}


export default function Employees() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api(`/employees?limit=50&search=${encodeURIComponent(q)}`)
      .then((data) => {
        const items = data?.items ?? data?.rows ?? data?.employees ?? data ?? [];
        if (!ignore) setRows(Array.isArray(items) ? items : [])
      })
      .catch((e) => !ignore && setErr(e))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [q]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Employees</h2>
        <Link
          to="/employees/new"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
          onClick={(e) => { e.preventDefault(); alert("Stub: /employees/new form page"); }}
        >
          New Employee
        </Link>
      </div>

      <div className="mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, employee no…"
          className="w-full md:w-80 px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
        />
      </div>

      <div className="rounded-xl border dark:border-gray-700 overflow-x-auto bg-white dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Employee No</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}><td className="px-4 py-3" colSpan={5}>Loading…</td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-6 text-center opacity-70" colSpan={5}>No employees found.</td></tr>
            ) : (
              rows.map((e) => (
                <tr key={e.id} className="border-t dark:border-gray-800">
                  <td className="px-4 py-2">{e.firstname} {e.lastname}</td>
                  <td className="px-4 py-2">{e.email}</td>
                  <td className="px-4 py-2">{e.employeeNumber || "—"}</td>
                  <td className="px-4 py-2">{e.is_active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => alert(`Stub: open /employees/${e.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {err && <div className="mt-3 text-sm text-red-600">Error loading employees.</div>}
    </div>
  );
}
