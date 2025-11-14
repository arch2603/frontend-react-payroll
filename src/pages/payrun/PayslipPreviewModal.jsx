// src/components/PayslipPreviewModal.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { payRunApi } from "../../lib/api";

export default function PayslipPreviewModal({
  open,
  onClose,
  runId,
  employeeId,
  token,
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [err, setErr] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!open || !runId || !employeeId) return;
    let revoke;
    async function load() {
      setErr('');
      setBlobUrl(null);
      try {
        const { data } = await payRunApi.getPayslipInlineView(runId, employeeId);
        const url = URL.createObjectURL(data);
        setBlobUrl(url);
        revoke = () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Failed to load payslip", e);
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load payslip";
        setErr(msg);
      }
    }

    load();
    return () => { if (revoke) revoke(); };
  }, [open, runId, employeeId]);

  const filename = useMemo(
    () => `payslip-${runId}-${employeeId}.pdf`,
    [runId, employeeId]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh]">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Payslip preview</h2>
          <div className="flex gap-2">
            {blobUrl && (
              <>
                <a
                  href={blobUrl}
                  download={filename}
                  className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                >
                  Download
                </a>
                <button
                  onClick={() => {
                    try { iframeRef.current?.contentWindow?.print(); } catch (_) { }
                  }}
                  className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                >
                  Print
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border bg-black text-white hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-100">
          {err ? (
            <div className="p-6 text-red-600">{err}</div>
          ) : blobUrl ? (
            <iframe
              ref={iframeRef}
              title="Payslip PDF"
              src={blobUrl}
              className="w-full h-full"
            />
          ) : (
            <div className="p-6 text-gray-500">Loading…</div>
          )}
        </div>
      </div>
    </div>
  );
}
