import { useState } from "react";

async function postFile(path, file) {
  const token = localStorage.getItem("token");
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api${path}`, {
    method: "POST",
    body: fd,
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`POST ${path} ${res.status}`);
  return res.json();
}

export default function TimesheetsImport() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await postFile("/timesheets/import", file);
      setResult(res); // e.g., { imported: 42, rejected: 3 }
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Import Timesheets</h2>

      <form onSubmit={handleSubmit} className="rounded-xl border dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="mb-3">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm"
          />
          <p className="text-xs opacity-70 mt-1">Upload a CSV with columns: employee_no, date, hours, rate, project(optional)</p>
        </div>
        <button
          type="submit"
          disabled={!file || loading}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
        >
          {loading ? "Uploading…" : "Import"}
        </button>
      </form>

      {result && (
        <div className="mt-4 rounded-lg border dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="font-medium mb-1">Import result</div>
          <div className="text-sm">Imported: {result.imported ?? 0}</div>
          <div className="text-sm">Rejected: {result.rejected ?? 0}</div>
          {Array.isArray(result.errors) && result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm underline">Errors</summary>
              <ul className="list-disc pl-5 text-sm mt-1">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {err && <div className="mt-3 text-sm text-red-600">Import failed. Check file format and try again.</div>}
    </div>
  );
}
