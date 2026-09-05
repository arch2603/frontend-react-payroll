import { useEffect, useState } from "react";
import { payRunApi } from "../lib/api";

const fmtMoney = (v) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: import.meta.env.VITE_PAYROLL_CURRENCY || 'WST',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

export default function SamoaSummaryCard({ runId = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = runId
          ? await payRunApi.getSamoaSummaryByRunId(runId)
          : await payRunApi.getCurrentSamoaSummary();

        if (!mounted) return;
        setData(res.data);
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || err.message || "Failed to load Samoa contributions");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [runId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-lg p-4 shadow-sm animate-pulse">
        <div className="h-3 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
        <div className="h-4 w-28 bg-gray-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  if (error || !data || !data.ok) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 rounded-lg p-4 text-xs">
        {error || data?.message || "Unable to load Samoa contributions"}
      </div>
    );
  }

  const t = data.totals || {};
  const hasAny =
    (t.npf_employee || 0) ||
    (t.npf_employer || 0) ||
    (t.acc_employer || 0);

  if (!hasAny) {
    // Nothing to show; keep UI clean
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          Samoa contributions (this run)
        </div>
        <div className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
          Run #{data.run_id}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">
            NPF (employee, 10%)
          </dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-50">
            {fmtMoney(t.npf_employee)}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">
            NPF (employer, 10%)
          </dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-50">
            {fmtMoney(t.npf_employer)}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">
            ACC (employer, 1%)
          </dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-50">
            {fmtMoney(t.acc_employer)}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">
            Employer total (NPF + ACC)
          </dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-50">
            {fmtMoney((t.npf_employer || 0) + (t.acc_employer || 0))}
          </dd>
        </div>
      </dl>
    </div>
  );
}
