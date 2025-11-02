
import { useMemo, useState } from "react";
import { patchItemFields } from "../../lib/api";

export default function PayRunItemsEditable({ status, rows, onReload, canEdit = true }) {
  const editable = canEdit && status === "Draft";
  const hasOt = useMemo(() => rows?.some(r => r?.ot_hours !== undefined && r?.ot_hours !== null), [rows]);

  async function saveField(row, field, value) {
    const id = row.id ?? row.line_id; // support both shapes
    const patch = {};
    patch[field] = value === "" ? 0 : Number(value);
    await patchItemFields(id, patch);
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <Th>Employee</Th>
            <Th align="right">Hours</Th>
            {hasOt && <Th align="right">OT Hours</Th>}
            <Th align="right">Allowance</Th>
            <Th align="right">Deductions</Th>
            <Th align="right">Super</Th>
            <Th align="right">Tax</Th>
            <Th align="right">Gross</Th>
            <Th align="right">Net</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows?.length ? rows.map((r) => (
            <Row
              key={r.id ?? r.line_id}
              row={r}
              editable={editable}
              hasOt={hasOt}
              onSave={saveField}
              onReload={onReload}
            />
          )) : (
            <tr><td colSpan={10} className="px-4 py-6 text-center opacity-70">No employees in this pay run yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return <th className={`px-3 py-2 text-${align} font-semibold`}>{children}</th>;
}

function Td({ children, align = "left" }) {
  return <td className={`px-3 py-2 text-${align}`}>{children}</td>;
}

function Num({ v }) {
  const n = Number(v ?? 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Money({ v }) {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
}

function EditableNumber({ value, onCommit, className = "w-24" }) {
  const [draft, setDraft] = useState(value ?? "");
  return (
    <input
      className={`border rounded px-2 py-1 text-right ${className}`}
      type="number"
      step="0.01"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
    />
  );
}

function Row({ row, editable, hasOt, onSave, onReload }) {
  const [saving, setSaving] = useState(false);
  const id = row.id ?? row.line_id;

  async function commit(field, value) {
    if (!editable) return;
    setSaving(true);
    try {
      await onSave(row, field, value);
      await onReload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className={`${saving ? "opacity-60" : ""} border-t dark:border-gray-800`}>
      <Td>{row.employeeName ?? row.employee_name ?? `#${row.employee_id}`}</Td>

      <Td align="right">
        {editable
          ? <EditableNumber value={row.hours} onCommit={(v) => commit("hours", v)} />
          : <Num v={row.hours} />
        }
      </Td>

      {hasOt && (
        <Td align="right">
          {editable
            ? <EditableNumber value={row.ot_hours} onCommit={(v) => commit("ot_hours", v)} />
            : <Num v={row.ot_hours} />
          }
        </Td>
      )}

      <Td align="right">
        {editable
          ? <EditableNumber className="w-28" value={row.allowance} onCommit={(v) => commit("allowance", v)} />
          : <Money v={row.allowance} />
        }
      </Td>

      <Td align="right">
        {editable
          ? <EditableNumber className="w-28" value={row.deductions} onCommit={(v) => commit("deductions", v)} />
          : <Money v={row.deductions} />
        }
      </Td>

      <Td align="right"><Money v={row.super} /></Td>
      <Td align="right"><Money v={row.tax} /></Td>
      <Td align="right"><Money v={row.gross} /></Td>
      <Td align="right"><Money v={row.net} /></Td>

      <Td>
        {/* per-row recalc button if your backend supports it */}
        <button
          className="px-2 py-1 rounded border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          disabled={!editable || saving}
          onClick={async () => { await commit("_recalc", true); }}
        >
          Recalc
        </button>
      </Td>
    </tr>
  );
}
