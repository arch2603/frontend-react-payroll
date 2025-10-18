import { useEffect, useState } from "react";

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

export default function PayRunCurrent() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setErr(null);
      const res = await api("/pay-runs/current");
      setData(res);
    } catch (e) {
      setErr(e);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(path) {
    setBusy(true);
    try {
      await api(path, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const status = data?.status || "None";

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Current Pay Run</h2>
        <div className="text-sm opacity-75">
          {data?.period ? `${data.period.start} → ${data.period.end}` : "No open period"}
        </div>
      </div>

      <div className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-900 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-75">Status:</span>
          <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">{status}</span>
          <div className="ml-auto flex gap-2">
            {status === "None" && (
              <button disabled={busy} onClick={() => act("/pay-runs/current/start")}
                className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm">
                {busy ? "Working…" : "Start Pay Run"}
              </button>
            )}
            {status === "Draft" && (
              <>
                <button disabled={busy} onClick={() => act("/pay-runs/current/recalculate")}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm">
                  Recalculate
                </button>
                <button disabled={busy} onClick={() => act("/pay-runs/current/approve")}
                  className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm">
                  Approve
                </button>
              </>
            )}
            {status === "Approved" && (
              <button disabled={busy} onClick={() => act("/pay-runs/current/post")}
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm">
                Post (Generate Payslips)
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border dark:border-gray-700 overflow-x-auto bg-white dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-right px-4 py-2">Gross</th>
              <th className="text-right px-4 py-2">Tax</th>
              <th className="text-right px-4 py-2">Deductions</th>
              <th className="text-right px-4 py-2">Net</th>
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <tr><td colSpan={5} className="px-4 py-6">Loading…</td></tr>
            ) : (data.items || []).length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center opacity-70">No employees in this pay run yet.</td></tr>
            ) : (
              data.items.map((it) => (
                <tr key={it.employee.id} className="border-t dark:border-gray-800">
                  <td className="px-4 py-2">{it.employee.name}</td>
                  <td className="px-4 py-2 text-right">{fmt(it.gross)}</td>
                  <td className="px-4 py-2 text-right">{fmt(it.tax)}</td>
                  <td className="px-4 py-2 text-right">{fmt(it.deductions)}</td>
                  <td className="px-4 py-2 text-right font-medium">{fmt(it.net)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {err && <div className="mt-3 text-sm text-red-600">Error loading pay run.</div>}
    </div>
  );
}

function fmt(n) {
  if (typeof n !== "number") return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
