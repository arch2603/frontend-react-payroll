import { useEffect, useMemo, useState } from "react";

async function api(path, opts = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: token ? `Bearer ${token}` : undefined,
      "Content-Type": opts.body instanceof FormData ? undefined : "application/json",
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${path} ${res.status}`);
  return res.json();
}

export default function History() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // filters
  const [employeeQ, setEmployeeQ] = useState("");
  const [from, setFrom] = useState(""); // yyyy-mm-dd
  const [to, setTo] = useState("");
  const [status, setStatus] = useState(""); // "", "emailed", "printed"

  // simple paging
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (employeeQ) p.set("employee", employeeQ);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (status) p.set("status", status);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [employeeQ, from, to, status, page]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api(`/history/payslips?${query}`)
      .then((data) => !ignore && (setRows(data.items || [])))
      .catch((e) => !ignore && setErr(e))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [query]);

  async function handleReprint(id) {
    const res = await fetch(`/api/payslips/${id}/print`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      credentials: "include",
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  function handleExportCsv() {
    const url = `/api/history/export.csv?${query}`;
    // Let the browser download the CSV
    window.open(url, "_blank");
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payslip History</h2>
        <button
          onClick={handleExportCsv}
          className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-3 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={employeeQ}
          onChange={(e) => { setEmployeeQ(e.target.value); setPage(1); }}
          placeholder="Search employee name or #"
          className="px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <option value="">Any status</option>
          <option value="printed">Printed</option>
          <option value="emailed">Emailed</option>
          <option value="unprinted">Not printed</option>
          <option value="unemailed">Not emailed</option>
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEmployeeQ(""); setFrom(""); setTo(""); setStatus(""); setPage(1); }}
            className="px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border dark:border-gray-700 overflow-x-auto bg-white dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2">Period</th>
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-right px-4 py-2">Gross</th>
              <th className="text-right px-4 py-2">Tax</th>
              <th className="text-right px-4 py-2">Deductions</th>
              <th className="text-right px-4 py-2">Net</th>
              <th className="text-center px-4 py-2">Printed</th>
              <th className="text-center px-4 py-2">Emailed</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-6">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center opacity-70">No results.</td></tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-t dark:border-gray-800">
                  <td className="px-4 py-2">{r.period_start} → {r.period_end}</td>
                  <td className="px-4 py-2">{r.employee_name} {r.employee_no ? `(#${r.employee_no})` : ""}</td>
                  <td className="px-4 py-2 text-right">{money(r.gross)}</td>
                  <td className="px-4 py-2 text-right">{money(r.tax)}</td>
                  <td className="px-4 py-2 text-right">{money(r.deductions)}</td>
                  <td className="px-4 py-2 text-right font-medium">{money(r.net)}</td>
                  <td className="px-4 py-2 text-center">{r.printed_at ? "✓" : "—"}</td>
                  <td className="px-4 py-2 text-center">{r.emailed_at ? "✓" : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleReprint(r.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Reprint
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-3 py-1.5 rounded border dark:border-gray-700 text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm opacity-70">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-1.5 rounded border dark:border-gray-700 text-sm"
        >
          Next
        </button>
      </div>

      {err && <div className="mt-3 text-sm text-red-600">Failed to load history.</div>}
    </div>
  );
}

function money(n) {
  if (typeof n !== "number") n = Number(n || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
