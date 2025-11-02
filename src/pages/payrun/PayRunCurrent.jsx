import { useEffect, useMemo, useState } from "react";
import { payRunApi, payPeriodApi, downloadBlob } from "../../lib/api";
import PayRunItemsEditable from "./PayRunItemsEditable";

const moneyFmt = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

function money(n) {
  return moneyFmt.format(Number(n || 0));
}
function num(n) {
  return Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-AU", { timeZone: "Australia/Brisbane" });
}

export default function PayRunCurrent() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [paging, setPaging] = useState({
    search: "",
    limit: 10,
    offset: 0,
    total: 0,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // NEW: period state
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [showPeriods, setShowPeriods] = useState(false);

  const status = summary?.status ?? "None";

  // ---- loaders ----
  async function loadSummary() {
    try {
      const { data } = await payRunApi.getSummary();
      setSummary(data);
    } catch (e) {
      // if there's no current run, some APIs 404 — make UI still work
      if (e?.response?.status === 404) {
        setSummary({ status: "None" });
      } else {
        throw e;
      }
    }
  }

  async function loadItems({ search, limit, offset } = {}) {
    const params = {
      search: search ?? paging.search ?? "",
      limit: Number(limit ?? paging.limit ?? 10),
      offset: Number(offset ?? paging.offset ?? 0),
    };
    const { data } = await payRunApi.getItems(params);
    setItems(Array.isArray(data.items) ? data.items : []);
    if (data.paging) {
      setPaging(data.paging);
    } else {
      setPaging((p) => ({ ...p, ...params, total: (data.items || []).length }));
    }
  }

  async function reload() {
    setErr("");
    try {
      await Promise.all([loadSummary(), loadItems()]);
    } catch (e) {
      console.error(e);
      setErr("Failed to load current pay run.");
    }
  }

  // NEW: load periods
  async function loadPeriods() {
    try {
      const { data } = await payPeriodApi.list();
      setPeriods(data);
      const current = data.find((p) => p.is_current);
      if (current) {
        setSelectedPeriodId(current.id);
      }
    } catch (e) {
      console.error("Failed to load periods", e);
    }
  }

  useEffect(() => {
    // 1) get periods
    loadPeriods().then(() => {
      // 2) load current run for whichever period is marked current
      reload();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- actions ----
  async function doStart() {
    setBusy(true);
    setErr("");
    try {
      await payRunApi.start();
      await reload();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Start failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doRecalc() {
    setBusy(true);
    setErr("");
    try {
      await payRunApi.recalc();
      await reload();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Recalculate failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doApprove() {
    if (!confirm("Approve this pay run? This will lock regular edits.")) return;
    setBusy(true);
    setErr("");
    try {
      await payRunApi.approve();
      await reload();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Approve failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doPost() {
    if (!confirm("Post this pay run? This finalises the run and generates artefacts.")) return;
    setBusy(true);
    setErr("");
    try {
      await payRunApi.post();
      await reload();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Post failed.");
    } finally {
      setBusy(false);
    }
  }

  // exports
  async function exportBankFile() {
    try {
      const { data } = await payRunApi.getBankFile();
      downloadBlob(data, `bank-file-${summary?.period?.start || "run"}.csv`);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to download bank file");
    }
  }
  async function exportSuperFile() {
    try {
      const { data } = await payRunApi.getSuperFile();
      downloadBlob(data, `super-file-${summary?.period?.start || "run"}.csv`);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to download super file");
    }
  }
  async function openPayslips() {
    try {
      const { data } = await payRunApi.getPayslips();
      const files = data?.files || data || [];
      if (!files.length) return alert("No payslips available yet.");
      files.slice(0, 10).forEach((f) => window.open(f.url || f, "_blank"));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to fetch payslips");
    }
  }

  // search & paging
  function onSearchSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const s = (formData.get("q") || "").toString().trim();
    loadItems({ search: s, limit: paging.limit, offset: 0 });
  }

  function changePage(delta) {
    const next = Math.max(0, (paging.offset || 0) + delta * (paging.limit || 10));
    loadItems({ offset: next });
  }

  const pageNo = useMemo(
    () => Math.floor((paging.offset || 0) / (paging.limit || 10)) + 1,
    [paging]
  );
  const pageCount = useMemo(() => {
    const lim = paging.limit || 10;
    return lim ? Math.max(1, Math.ceil((paging.total || 0) / lim)) : 1;
  }, [paging]);

  return (
    <div className="p-6">
      {/* Header with period selector */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Current Pay Run</h2>
          <p className="text-sm opacity-75">
            {summary?.period
              ? `${fmtDate(summary.period.start)} → ${fmtDate(summary.period.end)}`
              : "No open period"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* period selector */}
          <select
            value={selectedPeriodId || ""}
            onChange={async (e) => {
              const val = Number(e.target.value);
              setSelectedPeriodId(val);
              if (val) {
                await payPeriodApi.setCurrent(val);
                await reload();
              }
            }}
            className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
          >
            <option value="">Select period…</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {fmtDate(p.start_date)} → {fmtDate(p.end_date)}{" "}
                {p.is_current ? "(current)" : ""}
              </option>
            ))}
          </select>

          <span className="text-sm opacity-75">Status:</span>
          <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">
            {status}
          </span>

          <button
            onClick={() => setShowPeriods(true)}
            className="px-3 py-1.5 rounded border text-sm"
          >
            Manage
          </button>
        </div>
      </div>
      
      {summary?.status === "None" && (
            <div className="mb-3 rounded bg-amber-50 text-amber-800 px-3 py-2 text-sm">
              This period has no pay run yet.
              <button onClick={doStart} className="ml-2 underline">
                Start pay run now
              </button>
            </div>
          )}
      {/* Actions */}
      <div className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-900 mb-4">
        <div className="flex items-center gap-2">
          {status === "None" && (
            <button
              disabled={busy}
              onClick={doStart}
              className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              {busy ? "Working…" : "Start Pay Run"}
            </button>
          )}

          {status === "Draft" && (
            <>
              <button
                disabled={busy}
                onClick={doRecalc}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
              >
                Recalculate
              </button>
              <button
                disabled={busy}
                onClick={doApprove}
                className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm"
              >
                Approve
              </button>
            </>
          )}

          {status === "Approved" && (
            <>
              <button
                disabled={busy}
                onClick={doPost}
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm"
              >
                Post (Generate Payslips)
              </button>
              <button
                onClick={exportBankFile}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
              >
                Export Bank File
              </button>
              <button
                onClick={exportSuperFile}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
              >
                Export Super File
              </button>
              <button
                onClick={openPayslips}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
              >
                View Payslips
              </button>
            </>
          )}

          {status === "Posted" && (
            <>
              <button
                onClick={exportBankFile}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
              >
                Export Bank File
              </button>
              <button
                onClick={exportSuperFile}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
              >
                Export Super File
              </button>
              <button
                onClick={openPayslips}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-sm"
              >
                View Payslips
              </button>
            </>
          )}

          

          {/* search */}
          <form onSubmit={onSearchSubmit} className="ml-auto flex items-center gap-2">
            <input
              name="q"
              defaultValue={paging.search || ""}
              placeholder="Search employees…"
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
            />
            <button className="px-3 py-1.5 rounded bg-gray-900 text-white dark:bg-gray-100 dark:text-black text-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* TABLE (your existing table; swap for editable when ready) */}
      <div className="rounded-xl border dark:border-gray-700 overflow-x-auto bg-white dark:bg-gray-900 text-sm">
        <PayRunItemsEditable
          status={status}
          rows={items}
          onReload={reload}
          canEdit={true}
        />
      </div>

      {/* Pager */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="opacity-75">
          {paging.total ?? 0} items • Page {pageNo} of {pageCount}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={(paging.offset || 0) <= 0}
            className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => changePage(1)}
            disabled={(paging.offset || 0) + (paging.limit || 10) >= (paging.total || 0)}
            className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

      {/* Manage Periods Modal */}
      {showPeriods && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 w-[420px] max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Pay Periods</h3>
              <button onClick={() => setShowPeriods(false)} className="text-sm">
                ✕
              </button>
            </div>

            <ul className="space-y-2 mb-4">
              {periods.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>
                    {fmtDate(p.start_date)} → {fmtDate(p.end_date)}
                    {p.is_current && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                        current
                      </span>
                    )}
                  </span>
                  {!p.is_current && (
                    <button
                      onClick={async () => {
                        await payPeriodApi.setCurrent(p.id);
                        const { data } = await payPeriodApi.list();
                        setPeriods(data);
                        const current = data.find((x) => x.is_current);
                        setSelectedPeriodId(current ? current.id : null);
                        await reload();
                      }}
                      className="text-xs text-blue-600"
                    >
                      Make current
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <form
              className="space-y-2 border-t pt-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const start_date = fd.get("start_date");
                const end_date = fd.get("end_date");
                const make_current = fd.get("make_current") === "on";
                await payPeriodApi.create({ start_date, end_date, make_current });
                const { data } = await payPeriodApi.list();
                setPeriods(data);
                const current = data.find((x) => x.is_current);
                setSelectedPeriodId(current ? current.id : null);
                e.target.reset();
                await reload();
              }}
            >
              <div className="flex gap-2">
                <input
                  name="start_date"
                  type="date"
                  className="border rounded px-2 py-1 text-sm w-full"
                  required
                />
                <input
                  name="end_date"
                  type="date"
                  className="border rounded px-2 py-1 text-sm w-full"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input name="make_current" type="checkbox" /> Make current
              </label>
              <button className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">
                Add period
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

