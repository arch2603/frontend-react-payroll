import { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, PlaySquare, RefreshCw, AlertTriangle, Download, QuoteIcon } from "lucide-react";
import { api } from "../../lib/api";




function toMoney(n) { return `$${Number(n ?? 0).toFixed(2)}`; }

export default function PayrollView() {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [q, setQ] = useState({ search: "", limit: 25, offset: 0 });
  const [editing, setEditing] = useState({}); // line_id -> { hours: "xx", dirty: bool }
  const acRef = useRef(null);
  const saveTimer = useRef(null);
  

  // abort helper
  const abortInFlight = () => { if (acRef.current) acRef.current.abort(); acRef.current = new AbortController(); return acRef.current.signal; };

  const getSummary = async () => {
    try {
      const { data } = await api.get("/pay-runs/current/summary");
      setSummary(data);
    } catch {
      setSummary(null);
    }
  };

  const getItems = async () => {
    setLoading(true);
    try {

      const { data } = await api.get("/pay-runs/current/items", {params: q});
      setRows(data.items || []);
      console.log('[PayrollView] items sample', (data.items || []).slice(0, 2));
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
    
  };

  useEffect(() => { getSummary(); getItems(); /* eslint-disable-next-line */ }, [q.offset]);

  const recalc = async () => { setBusy(true); try { await api.post("/pay-runs/current/recalculate"); } finally { setBusy(false); } getSummary(); getItems(); };
  const commit = async () => { setBusy(true); try { await api.post("/pay-runs/current/commit"); } finally { setBusy(false); } getSummary(); };
  const gen    = async () => { setBusy(true); try { await api.post("/pay-runs/current/generate-payslips"); } finally { setBusy(false); } };

  // inline edit
  const startEdit = (line) => {
    setEditing(e => ({ ...e, [line.line_id]: { hours: String(line.hours ?? ""), dirty: false, original: line.hours } }));
  };
  const changeEdit = (id, val) => {
    setEditing(e => ({ ...e, [id]: { ...e[id], hours: val, dirty: String(val) !== String(e[id].original) } }));
    // debounce save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveRow(id), 600);
  };
  const cancelEdit = (id) => setEditing(e => { const n = { ...e }; delete n[id]; return n; });
  const saveRow = async (id) => {
    const edit = editing[id]; if (!edit || !edit.dirty) return;
    // optimistic update
    setRows(rs => rs.map(r => r.line_id === id ? { ...r, hours: Number(edit.hours) } : r));
    await api.patch(`/pay-runs/current/items/${id}`, { hours: Number(edit.hours) });
    // refresh totals (recalc on server might be heavy; keep summary quick)
    getSummary();
    setEditing(e => ({ ...e, [id]: { ...e[id], original: edit.hours, dirty: false } }));
  };

  // CSV export
  const exportCsv = () => {
    const header = ["Employee", "Hours", "Gross", "Deductions", "Tax", "Super", "Net", "Status"];
    const lines = rows.map(r => [
      r.employee_name, r.hours, r.gross, r.deductions, r.tax, r.super, r.net, r.status
    ]);
    const csv = [header, ...lines].map(a => a.map(x => `"${x ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "payroll.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Sticky summary */}
      <div className="sticky top-[56px] z-20 mb-4">
        <div className="rounded-xl border dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur p-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Payroll</h2>
            <div className="flex items-center gap-2">
              <input placeholder="Search employee…" className="px-3 py-2 rounded border dark:border-gray-700 bg-transparent"
                value={q.search} onChange={e => setQ(s => ({ ...s, search: e.target.value, offset: 0 }))} />
              <button onClick={exportCsv} className="px-3 py-2 rounded border hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button onClick={recalc} disabled={busy} className="px-3 py-2 rounded border hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Recalculate
              </button>
              <button onClick={commit} disabled={busy} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2">
                <PlaySquare className="h-4 w-4" /> Commit Run
              </button>
              <button onClick={gen} disabled={busy} className="px-3 py-2 rounded border hover:bg-gray-100 dark:hover:bg-gray-800">
                Generate Payslips
              </button>
            </div>
          </div>
          {summary && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <Stat label="Employees" value={summary.totals?.employees ?? "—"} />
              <Stat label="Gross" value={toMoney(summary.totals?.gross)} />
              <Stat label="Net" value={toMoney(summary.totals?.net)} />
              <Stat label="Warnings" value={summary.warnings ?? 0} warn />
            </div>
          )}
        </div>
      </div>

      {/* Warnings banner */}
      {summary?.warnings > 0 && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {summary.warnings} validation warning(s). Recalculate and resolve before commit.
        </div>
      )}

      <div className="rounded-xl border dark:border-gray-700 overflow-auto max-h-[70vh]">
        <table className="w-full text-sm table-fixed">
          <thead className="sticky top-0 z-20 bg-white dark:bg-gray-900 shadow-sm">
            <tr>
              <th className="p-3 text-left whitespace-nowrap">Employee</th>
              <th className="p-3 text-right whitespace-nowrap">Hours</th>
              <th className="p-3 text-right whitespace-nowrap">Gross</th>
              <th className="p-3 text-right whitespace-nowrap">Deductions</th>
              <th className="p-3 text-right whitespace-nowrap">Tax</th>
              <th className="p-3 text-right whitespace-nowrap">Super</th>
              <th className="p-3 text-right whitespace-nowrap">Net</th>
              <th className="p-3 text-left whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(6)].map((_, i) => (
              <tr key={i}><td colSpan={8} className="p-3"><div className="h-6 bg-gray-200/60 dark:bg-gray-800/60 animate-pulse rounded" /></td></tr>
            )) : rows.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center opacity-70">No lines in this run.</td></tr>
            ) : rows.map(r => {
              const e = editing[r.line_id];
              return (
                <tr key={r.line_id} className="border-t dark:border-gray-800">
                  <td className="p-3">{r.employeeName }</td>

                  {/* Hours inline editor */}
                  <td className="p-3 text-right">
                    {e ? (
                      <input
                        autoFocus
                        value={e.hours}
                        onChange={ev => changeEdit(r.line_id, ev.target.value)}
                        onBlur={() => saveRow(r.line_id)}
                        onKeyDown={(ev) => { if (ev.key === "Enter") saveRow(r.line_id); if (ev.key === "Escape") cancelEdit(r.line_id); }}
                        className="w-24 text-right px-2 py-1 rounded border dark:border-gray-700 bg-transparent"
                      />
                    ) : (
                      <button className="w-24 text-right px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => startEdit(r)}>{r.hours}</button>
                    )}
                  </td>

                  <td className="p-3 text-right">{toMoney(r.gross)}</td>
                  <td className="p-3 text-right">{toMoney(r.deductions)}</td>
                  <td className="p-3 text-right">{toMoney(r.tax)}</td>
                  <td className="p-3 text-right">{toMoney(r.super)}</td>
                  <td className="p-3 text-right">{toMoney(r.net)}</td>
                  <td className="p-3">{r.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-sm">
        <span className="opacity-70">Total: {total}</span>
        <button disabled={q.offset === 0} onClick={() => setQ(s => ({ ...s, offset: Math.max(0, s.offset - s.limit) }))}
          className="px-2 py-1 rounded border disabled:opacity-50">Prev</button>
        <button disabled={q.offset + q.limit >= total} onClick={() => setQ(s => ({ ...s, offset: s.offset + s.limit }))}
          className="px-2 py-1 rounded border disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div className={`rounded-lg border dark:border-gray-700 p-3 ${warn ? "border-amber-300" : ""}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className={`text-lg font-semibold ${warn ? "text-amber-700 dark:text-amber-300" : ""}`}>{value ?? "—"}</div>
    </div>
  );
}
