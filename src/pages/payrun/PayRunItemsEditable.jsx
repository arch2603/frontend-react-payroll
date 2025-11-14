import { useMemo, useState, useRef } from "react";
import { payRunApi } from "../../lib/api";
import PayslipPreviewModal from "./PayslipPreviewModal";


const EDITABLE_FIELDS = ["hours", "allowance", "deductions", "super", "tax", "note", "ot_15_hours", "ot_20_hours"]; // 'rate' typically computed; include if your model allows editing

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(v ?? 0));

const fmtNum = (v) =>
  Number(v ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function isFiniteNum(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function parseCell(key, raw) {
  if (key === "note") return String(raw ?? "");
  // Treat empty as null (let server decide) rather than 0 to avoid accidental zeroing
  if (raw === "" || raw == null) return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).trim());
  return Number.isFinite(n) ? n : null;
}

export default function PayRunItemsEditable({

  runId,
  status,
  items = [],
  onPatched,
  onReload,
  allowRecalc = true,
  token,          // <— add
  apiBase,
}) {
  const isDraft = status === "Draft";
  const [savingId, setSavingId] = useState(null); // which row is saving
  const [errMap, setErrMap] = useState({}); // { [rowId]: string }
  const lastCommittedRef = useRef({}); // track last committed values to support Escape revert

  const [previewState, setPreviewState] = useState({
    open: false,
    employeeId: null,
  });

  const [selectedForPreview, setSelectedForPreview] = useState({});

  const openPreview = (employeeId) => {
    setPreviewState({ open: true, employeeId });
  };

  const closePreview = () => {
    setPreviewState((prev) => ({ ...prev, open: false }));
  };

  const hasOt = useMemo(
    () => items?.some(r => (r?.ot_15_hours ?? 0) > 0 || (r?.ot_20_hours ?? 0) > 0),
    [items, runId]
  );

  const baseCols = useMemo(
    () => [
      { key: "employeeName", label: "Employee" },
      { key: "hours", label: "Hours", editable: true, type: "number" },
      { key: "hourlyRate", label: "Rate", format: "money" },
      { key: "allowance", label: "Allowance", editable: true, type: "money" },
      { key: "deductions_total", label: "Deductions", editable: true, type: "money" },
      { key: "super", label: "Super", editable: true, type: "money" },
      { key: "ot_15_hours", label: "Time and half", editable: true, type: "money" },
      { key: "ot_20_hours", label: "Double Time", editable: true, type: "money" },
      { key: "tax", label: "Tax", editable: true, type: "money" },
      { key: "gross", label: "Gross", format: "money" },
      { key: "net", label: "Net", format: "money" },

    ],
    []
  );

  const OT_COLS = [
    { key: "ot_15_hours", label: "OT 1.5 Hours", editable: true, type: "number" },
    { key: "ot_20_hours", label: "OT 2.0 Hours", editable: true, type: "number" }
  ];

  const columns = useMemo(() => {
    const cols = [...baseCols];
    if (hasOt) {
      cols.splice(2, 0, ...OT_COLS);
    }
    return cols;
  }, [baseCols, hasOt, runId]);

  // const canEdit = useMemo(() => isDraft && !!runId, [isDraft, runId]);

  //  useEffect(() => {
  //   // e.g., clear row error map, lastCommittedRef, etc., on run switch
  //   setErrMap({});
  //   lastCommittedRef.current = {};
  // }, [runId]);

  async function applyPatch(id, body) {
    const updated = await payRunApi.patchItem(id, body);
    await onPatched?.(updated);
    return updated;
  }

  async function saveCell(row, key, raw) {
    if (!EDITABLE_FIELDS.includes(key)) return;
    if (!isDraft) return;

    const id = row.id;
    const parsed = parseCell(key, raw);

    // No-op guard – only issue a PATCH if value changed
    const current = row?.[key];
    const same = key === "note"
      ? String(current ?? "") === String(parsed ?? "")
      : Number(current ?? 0) === Number(parsed ?? 0);
    if (same) return;

    try {
      setErrMap((m) => ({ ...m, [id]: undefined }));
      setSavingId(id);
      const updated = await applyPatch(id, { [key]: parsed });
      // Keep an after-commit snapshot for Escape revert behavior
      lastCommittedRef.current[id] = {
        ...(lastCommittedRef.current[id] || {}),
        [key]: updated?.[key],
      };
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save";
      setErrMap((m) => ({ ...m, [id]: msg }));
      // Optional: reload to re-sync view with server truth
      if (onReload) {
        try { await onReload(); } catch { }
      }
    } finally {
      setSavingId(null);
    }
  }

  async function recalcRow(row) {
    const id = row.id;
    try {
      setErrMap((m) => ({ ...m, [id]: undefined }));
      setSavingId(id);
      let data;
      if (typeof payRunApi.recalc === "function") {
        ({ data } = await payRunApi.recalcItem(id));
      } else {
        ({ data } = await payRunApi.patchItem(id, { _recalc: true }));
      }
      await onPatched?.(data);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to recalc";
      setErrMap((m) => ({ ...m, [id]: msg }));
      if (onReload) {
        try { await onReload(); } catch { }
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
  <>  
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-3 py-2 font-semibold ${c.type === "number" || c.format === "money" ? "text-right" : "text-left"}`}
              >
                {c.label}
              </th>
            ))}
            <th scope="col" className="px-3 py-2 text-left">Preview</th>
            {allowRecalc && <th scope="col" className="px-3 py-2 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items?.length ? (
            items.map((row) => (
              <tr key={row.id} className="border-t" aria-busy={savingId === row.id}>
                {columns.map((col) => {
                  const val = row[col.key];
                  const editable = isDraft && col.editable;
                  const right = col.type === "number" || col.format === "money";

                  const display = col.format === "money" ? fmtMoney(val)
                    : col.type === "number" ? fmtNum(val)
                      : String(val ?? "");

                  return (
                    <td key={col.key} className={`px-3 py-1 ${right ? "text-right" : "text-left"}`}>
                      {editable ? (
                        <CellEditor
                          row={row}
                          col={col}
                          initialValue={val}
                          disabled={savingId === row.id}
                          onCommit={(raw) => saveCell(row, col.key, raw)}
                        />
                      ) : (
                        <span>{display}</span>
                      )}
                    </td>
                  );
                })}

                <td className="px-3 py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!selectedForPreview[row.id]}
                      onChange={(e) =>
                        setSelectedForPreview((prev) => ({
                          ...prev,
                          [row.id]: e.target.checked,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="text-blue-600 underline disabled:text-gray-400 disabled:no-underline"
                      disabled={!selectedForPreview[row.id]}
                      onClick={() => openPreview(row.employeeId)}
                    >
                      View payslip
                    </button>
                  </div>
                </td>

                {allowRecalc && (
                  <td className="px-3 py-1">
                    <button
                      className="px-2 py-1 rounded border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={!isDraft || savingId === row.id}
                      onClick={() => recalcRow(row)}
                    >
                      Recalc
                    </button>
                    {errMap[row.id] && (
                      <div className="mt-1 text-xs text-red-600" aria-live="polite">{errMap[row.id]}</div>
                    )}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (allowRecalc ? 1 : 0)} className="px-4 py-6 text-center opacity-70">
                No employees in this pay run yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <PayslipPreviewModal
      open={previewState.open}
      onClose={closePreview}
      runId={runId}
      employeeId={previewState.employeeId}
      token={token}
      apiBase={apiBase}
    />
  </>
    
  );
}

function CellEditor({ row, col, initialValue, disabled, onCommit }) {
  const ref = useRef(null);
  const isText = col.type === "text";
  const isNumber = col.type === "number" || col.type === "money";
  const width = col.wide ? "w-48" : isText ? "w-48" : "w-24";

  return (
    <input
      ref={ref}
      className={`border rounded px-2 py-1 ${isNumber ? "text-right" : "text-left"} ${width}`}
      type={isText ? "text" : "number"}
      step={isNumber ? "0.01" : undefined}
      defaultValue={initialValue ?? ""}
      aria-invalid={undefined}
      disabled={disabled}
      onBlur={(e) => onCommit?.(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          // revert display to last committed value, if tracked, else initial
          if (ref.current) ref.current.value = initialValue ?? "";
          e.currentTarget.blur();
        }
      }}
    />
  );
}
