import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from '../lib/api';
import {
  Users,
  CalendarCheck2,
  FileSignature,
  AlarmClockCheck,
  PlaySquare,
  Upload,
  UserPlus,
} from "lucide-react";

// Small generic card
function KPICard({ title, value, to, icon: Icon, loading, error }) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm opacity-75">{title}</div>
        <div className="text-2xl font-semibold">
          {loading ? "…" : error ? "—" : value}
        </div>
      </div>
    </div>
  );
  return (
    <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:shadow-sm transition">
      {to ? <Link to={to}>{content}</Link> : content}
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {right}
      </div>
      <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 p-4">{children}</div>
    </section>
  );
}

// Tiny fetch helper with AbortController
async function apiGet(path, signal) {
  const { data } = await api.get(path, { signal });
  return data;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Data slices
  const [counts, setCounts] = useState({
    employees: 0,
    openPayRunStatus: "—",
    payslipsPending: 0,
    leavesPending: 0,
  });

  const [recent, setRecent] = useState([]); // last 5 actions
  const [keyDates, setKeyDates] = useState({
    nextPeriodEnd: null,
    publicHolidays: [], // [{date, name}]
  });

  const [errors, setErrors] = useState({
    employees: false,
    payrun: false,
    payslips: false,
    leaves: false,
  });


  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      const helper = (r, def = null) => (r.status === "fulfilled" ? r.value : def);

      const results = await Promise.allSettled([
        apiGet("/dashboard/employees/count", ac.signal),  // 0
        apiGet("/pay-runs/current/summary", ac.signal),   // 1 (may not exist yet)
        apiGet("/dashboard/payslips/pending/count", ac.signal), // 2
        apiGet("/dashboard/leaves/pending/count", ac.signal),   // 3
        apiGet("/dashboard/audit?limit=5", ac.signal),           // 4
        apiGet("/dashboard/calendar/next-key-dates", ac.signal),
      ]);

      const [employeesRes, payrunRes, payslipRes, leavesRes, auditRes, calendarRes] = results;
      setErrors({
        employees: employeesRes.status === "rejected",
        payrun: payrunRes.status === "rejected",
        payslips: payslipRes.status === "rejected",
        leaves: leavesRes.status === "rejected",
      });
      setCounts({
        employees: helper(employeesRes, { count: 0 })?.count ?? 0,
        openPayRunStatus: helper(payrunRes, { status: "None" })?.status ?? "None",
        payslipsPending: helper(payslipRes, { count: 0 })?.count ?? 0,
        leavesPending: helper(leavesRes, { count: 0 })?.count ?? 0,
      });

      setRecent(helper(auditRes, { items: [] })?.items ?? []);
      setKeyDates({
        nextPeriodEnd: helper(calendarRes, { nextPeriodEnd: null })?.nextPeriodEnd ?? null,
        publicHolidays: helper(calendarRes, { publicHolidays: [] })?.publicHolidays ?? [],
      });

      // if at least one failed, keep a soft error message but DO NOT block KPIs
      const anyFailed = results.some(r => r.status === "rejected");
      setErr(anyFailed ? new Error("Some dashboard data failed to load") : null);
      setLoading(false);

    })();

    return () => ac.abort();
  }, []);

  const nextHoliday = useMemo(() => {
    const today = new Date();
    const upcoming = (keyDates.publicHolidays || [])
      .map(h => ({ ...h, dateObj: new Date(h.date) }))
      .filter(h => h.dateObj >= today)
      .sort((a, b) => a.dateObj - b.dateObj)[0];
    return upcoming || null;
  }, [keyDates.publicHolidays]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Employees"
          value={counts.employees}
          to="/employees"
          icon={Users}
          loading={loading}
          error={errors.employees}
        />
        <KPICard
          title="Open Pay Run"
          value={counts.openPayRunStatus}
          to="/payruns/current"
          icon={CalendarCheck2}
          loading={loading}
          error={errors.payrun}
        />
        <KPICard
          title="Payslips not distributed"
          value={counts.payslipsPending}
          to="/payruns/current"
          icon={FileSignature}
          loading={loading}
          error={errors.payslips}
        />
        <KPICard
          title="Leave requests awaiting review"
          value={counts.leavesPending}
          to="/leaves"
          icon={AlarmClockCheck}
          loading={loading}
          error={errors.leaves}
        />
        <KPICard
          title="Payroll history"
          value="View"
          to="/history"
          icon={FileSignature}
          loading={false}
          error={false}
        />

      </div>

      {/* Shortcuts */}
      <Section
        title="Shortcuts"
        right={
          <div className="text-xs opacity-75">
            Tip: hover the sidebar to preload pages.
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/payruns/current")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <PlaySquare className="h-4 w-4" /> Start Pay Run
          </button>
          <button
            onClick={() => navigate("/timesheets/import")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Upload className="h-4 w-4" /> Import Timesheets
          </button>
          <button
            onClick={() => navigate("/employees")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <UserPlus className="h-4 w-4" /> New Employee
          </button>
          <button
            onClick={() => navigate("/history")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FileSignature className="h-4 w-4" /> Payroll history
          </button>
        </div>
      </Section>

      {/* Next key dates */}
      <Section title="Next key dates">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm opacity-70 mb-1">Next pay period ends</div>
            <div className="text-lg font-medium">
              {loading ? "…" : keyDates.nextPeriodEnd ? formatDate(keyDates.nextPeriodEnd) : "—"}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm opacity-70 mb-1">Upcoming public holiday</div>
            <div className="text-lg font-medium">
              {loading
                ? "…"
                : nextHoliday
                  ? `${nextHoliday.name} — ${formatDate(nextHoliday.date)}`
                  : "None in the next 60 days"}
            </div>
          </div>
        </div>
      </Section>

      {/* Recent activity */}
      <Section
        title="Recent activity"
        right={
          <Link
            to="/history"
            className="text-sm underline underline-offset-4 hover:opacity-80"
          >
            View all
          </Link>
        }
      >
        {loading ? (
          <ul className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <li key={i} className="h-6 rounded bg-gray-200/60 dark:bg-gray-800/60 animate-pulse" />
            ))}
          </ul>
        ) : recent.length === 0 ? (
          <div className="text-sm opacity-70">No recent activity.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {recent.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm">
                    <span className="font-medium">{a.user_name ?? "System"}</span>{" "}
                    {a.action}
                  </span>
                  <span className="text-xs opacity-70">
                    {a.entity} · {a.entity_id}
                  </span>
                </div>
                <span className="text-xs opacity-70">{formatDateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {err && (
        <div className="mt-4 text-sm text-red-600">
          Couldn’t load some dashboard data. Try reloading.
        </div>
      )}
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString();
}
function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}
