import { useState } from "react";
import { patchLineHours } from "../lib/api";

// Expect lines: [{ line_id, employee_name, hours, rate, ... }]
export default function PayRunTable({ lines, onUpdate }) {
  const [editing, setEditing] = useState(null);     // current editing line_id
  const [draftHours, setDraftHours] = useState("");

  const beginEdit = (line) => {
    setEditing(line.line_id);
    setDraftHours(String(line.hours ?? 0));
  };

  const cancel = () => {
    setEditing(null);
    setDraftHours("");
  };

  const save = async (line) => {
    const next = Number(draftHours);

    // unchanged?
    if (String(draftHours) === String(line.hours)) {
      setEditing(null);
      return;
    }

    if (!Number.isFinite(next) || next < 0) {
      alert("Hours must be a non-negative number");
      return;
    }

    // optimistic update
    onUpdate((prev) =>
      prev.map((l) => (l.line_id === line.line_id ? { ...l, hours: next } : l))
    );

    try {
      const res = await patchLineHours(line.line_id, next);
      if (res?.item) {
        onUpdate((prev) =>
          prev.map((l) => (l.line_id === line.line_id ? { ...l, ...res.item } : l))
        );
      }
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update hours");
      // rollback
      onUpdate((prev) =>
        prev.map((l) => (l.line_id === line.line_id ? { ...l, hours: line.hours } : l))
      );
    }
  };

  const onKeyDown = (e, line) => {
    if (e.key === "Enter") save(line);
    if (e.key === "Escape") cancel();
  };

  const hasChanged = (line) => String(draftHours) !== String(line.hours);

  return (
    <table className="min-w-full">
      <thead>
        <tr>
          <th className="text-left p-2">Employee</th>
          <th className="text-right p-2">Hours</th>
          <th className="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.line_id} className="border-t">
            <td className="p-2">{line.employee_name}</td>

            <td className="p-2 text-right">
              {editing === line.line_id ? (
                <input
                  type="number"
                  step="0.01"
                  value={draftHours}
                  onChange={(e) => setDraftHours(e.target.value)}
                  onKeyDown={(e) => onKeyDown(e, line)}
                  className="border rounded px-2 py-1 w-28 text-right"
                  autoFocus
                />
              ) : (
                line.hours
              )}
            </td>

            <td className="p-2">
              {editing === line.line_id ? (
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                    disabled={!hasChanged(line)}
                    onClick={() => save(line)}
                  >
                    Save
                  </button>
                  <button className="px-3 py-1 rounded bg-gray-200" onClick={cancel}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="px-3 py-1 rounded bg-gray-100"
                  onClick={() => beginEdit(line)}
                >
                  Edit
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
