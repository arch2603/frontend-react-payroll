import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api"

export default function Employees() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  console.log("api baseURL =", api.defaults.baseURL);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    //api(`/employees?limit=50&search=${encodeURIComponent(q)}`)
    api
      .get("/employees", { params: { limit: 50, search: q, _: Date.now()}})
      .then(({ data } ) => {
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
                  <td className="px-4 py-2">{e.status ? "Active" : "Inactive"}</td>
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
