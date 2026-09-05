import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { employeesApi } from "../../lib/api";

export default function EmployeeDetails() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchEmployee() {
      try {
        const res = await employeesApi.getEmployeeById(id);
        if (!isMounted) return;

        const data = res.data || {};

        // Ensure bank_account object exists so the UI never blows up
        const safeBankAccount = data.bank_account || {
          bank_code: "",
          bsb: "",
          account_number: "",
          account_name: "",
          is_default: true,
          is_active: true,
          is_primary: true,
        };

        setEmp({ ...data, bank_account: safeBankAccount });
      } catch (err) {
        console.error("Failed to load employee", err);
        if (isMounted) {
          setError("Unable to load employee details. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchEmployee();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmp((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setEmp((prev) => ({
      ...prev,
      bank_account: {
        bank_code: "",
        bsb: "",
        account_number: "",
        account_name: "",
        is_default: true,
        is_active: true,
        is_primary: true,
        ...(prev.bank_account || {}),
        [name]: value,
      },
    }));
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!emp) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        first_name: emp.first_name,
        last_name: emp.last_name,
        dob: emp.dob,
        email: emp.email,
        employee_number: emp.employee_number,
        position: emp.position,
        pay_type: emp.pay_type,
        pay_cycle: emp.pay_cycle,
        hourly_rate: emp.hourly_rate,
        standard_hours_per_week: emp.standard_hours_per_week,
        tax_rate: emp.tax_rate,
        is_active: emp.is_active,
      };

      if (emp.bank_account) {
        Object.assign(payload, {
          bank_code: emp.bank_account.bank_code,
          bsb: emp.bank_account.bsb,
          account_number: emp.bank_account.account_number,
          account_name: emp.bank_account.account_name,
          is_default: emp.bank_account.is_default,
          is_active_bank: emp.bank_account.is_active,
          is_primary: emp.bank_account.is_primary,
        });
      }

      await employeesApi.updateEmployee(id, payload);
      setSuccess("Employee details saved successfully.");
    } catch (err) {
      console.error("Update employee failed", err);
      setError("Unable to save changes. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="animate-pulse text-slate-500">Loading employee…</div>
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          Employee not found.
        </div>
      </div>
    );
  }

  const inputClass =
    "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

  const labelClass = "block text-xs font-medium text-slate-700 mb-1";

  const helpTextClass = "mt-1 text-[11px] text-slate-500";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h1 className="text-lg font-semibold text-slate-900">
            Employee Details
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            View and update personal, employment and bank account information.
          </p>
        </div>

        {/* Alerts */}
        <div className="px-6 pt-4 space-y-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {success}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-2 space-y-8">
          {/* Personal Details */}
          <section>
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="first_name">
                  First name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  value={emp.first_name || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="last_name">
                  Last name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  value={emp.last_name || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="dob">
                  Date of birth
                </label>
                <input
                  id="dob"
                  type="date"
                  name="dob"
                  value={emp.dob || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
                <p className={helpTextClass}>
                  Used for age-based entitlements and reporting.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={emp.email || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
                <p className={helpTextClass}>
                  Used for sending payslips and notifications.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="employee_number">
                  Employee number
                </label>
                <input
                  id="employee_number"
                  name="employee_number"
                  value={emp.employee_number || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="position">
                  Position / Job title
                </label>
                <input
                  id="position"
                  name="position"
                  value={emp.position || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Employment Details */}
          <section>
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Employment & Pay
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="pay_type">
                  Pay type
                </label>
                <select
                  id="pay_type"
                  name="pay_type"
                  value={emp.pay_type || ""}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select pay type</option>
                  <option value="HOURLY">Hourly</option>
                  <option value="SALARY">Salary</option>
                  <option value="CASUAL">Casual</option>
                  <option value="CONTRACTOR">Contractor</option>
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="pay_cycle">
                  Pay cycle
                </label>
                <select
                  id="pay_cycle"
                  name="pay_cycle"
                  value={emp.pay_cycle || ""}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select pay cycle</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="FORTNIGHTLY">Fortnightly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="hourly_rate">
                  Hourly rate (AUD)
                </label>
                <input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  step="0.01"
                  value={emp.hourly_rate ?? ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="standard_hours_per_week">
                  Standard hours per week
                </label>
                <input
                  id="standard_hours_per_week"
                  name="standard_hours_per_week"
                  type="number"
                  step="0.01"
                  value={emp.standard_hours_per_week ?? ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="tax_rate">
                  Tax rate (%)
                </label>
                <input
                  id="tax_rate"
                  name="tax_rate"
                  type="number"
                  step="0.01"
                  value={emp.tax_rate ?? ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="is_active">
                  Employment status
                </label>
                <select
                  id="is_active"
                  name="is_active"
                  value={emp.is_active ? "true" : "false"}
                  onChange={(e) =>
                    setEmp((prev) => ({
                      ...prev,
                      is_active: e.target.value === "true",
                    }))
                  }
                  className={inputClass}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <p className={helpTextClass}>
                  Inactive employees will be excluded from new pay runs.
                </p>
              </div>
            </div>
          </section>

          {/* Bank Account */}
          <section>
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Bank Account (Primary)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="bank_code">
                  Bank code
                </label>
                <input
                  id="bank_code"
                  name="bank_code"
                  placeholder="e.g. ANZ, CBA"
                  value={emp.bank_account?.bank_code || ""}
                  onChange={handleBankChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="bsb">
                  BSB
                </label>
                <input
                  id="bsb"
                  name="bsb"
                  placeholder="e.g. 123-456"
                  value={emp.bank_account?.bsb || ""}
                  onChange={handleBankChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="account_number">
                  Account number
                </label>
                <input
                  id="account_number"
                  name="account_number"
                  placeholder="e.g. 012345678"
                  value={emp.bank_account?.account_number || ""}
                  onChange={handleBankChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="account_name">
                  Account name
                </label>
                <input
                  id="account_name"
                  name="account_name"
                  placeholder="e.g. J SMITH"
                  value={emp.bank_account?.account_name || ""}
                  onChange={handleBankChange}
                  className={inputClass}
                />
              </div>
            </div>
            <p className={helpTextClass}>
              These details will be used when generating the bank file for pay
              runs.
            </p>
          </section>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-xs font-medium text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-100"
            onClick={() => window.history.back()}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}