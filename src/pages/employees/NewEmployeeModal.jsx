import { useState, useEffect } from "react";
import { employeesApi } from "../../lib/api"; // adjust import to your setup

const PAY_TYPES = [
  { value: "hourly", label: "Hourly" },
  { value: "salary", label: "Salary" },
];

const PAY_CYCLES = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
];

export default function NewEmployeeModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    email: "",
    employee_number: "",
    position: "",
    tax_rate: "",
    is_active: true,
    pay_type: "hourly",
    hourly_rate: "",
    standard_hours_per_week: "38",
    pay_cycle: "weekly",

    // bank details (optional)
    bank_code: "",
    bsb: "",
    account_number: "",
    account_name: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        first_name: "",
        last_name: "",
        dob: "",
        email: "",
        employee_number: "",
        position: "",
        tax_rate: "",
        is_active: true,
        pay_type: "hourly",
        hourly_rate: "",
        standard_hours_per_week: "38",
        pay_cycle: "weekly",
        bank_code: "",
        bsb: "",
        account_number: "",
        account_name: "",
      }));
      setErrors({});
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.first_name.trim()) nextErrors.first_name = "First name is required";
    if (!form.last_name.trim()) nextErrors.last_name = "Last name is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";
    if (!form.employee_number.trim())
      nextErrors.employee_number = "Employee # is required";
    if (!form.position.trim()) nextErrors.position = "Position is required";

    if (!form.hourly_rate || Number(form.hourly_rate) <= 0) {
      nextErrors.hourly_rate = "Hourly rate must be greater than 0";
    }

    if (!form.pay_cycle) nextErrors.pay_cycle = "Select a pay cycle";

    // Optional: light bank validation if any bank fields are filled
    const anyBankFilled =
      form.bsb || form.account_number || form.account_name || form.bank_code;
    if (anyBankFilled) {
      if (!form.bsb) nextErrors.bsb = "BSB is required if adding bank details";
      if (!form.account_number)
        nextErrors.account_number = "Account number is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      // Convert numeric fields properly
      const payload = {
        ...form,
        tax_rate: form.tax_rate ? Number(form.tax_rate) : null,
        hourly_rate: Number(form.hourly_rate),
        standard_hours_per_week: form.standard_hours_per_week
          ? Number(form.standard_hours_per_week)
          : null,
      };

      // Adjust to your API helper naming if needed
      const res = await employeesApi.createEmployee(payload);
      onCreated?.(res.data);
      onClose?.();
    } catch (err) {
      console.error("Create employee failed:", err);
      alert(
        err.response?.data?.message ||
          "Failed to create employee. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Modal panel */}
      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              New Employee
            </h2>
            <p className="text-xs text-gray-500">
              Enter core details to onboard a new employee into the payroll
              system.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-4">
            {/* Personal Details */}
            <section className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Personal details
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Basic information used on payslips and HR records.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    First name<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    autoFocus
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Last name<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.last_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Employment Details */}
            <section className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Employment details
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Used for internal records and pay run grouping.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Employee #<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="employee_number"
                    value={form.employee_number}
                    onChange={handleChange}
                    placeholder="E0001"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.employee_number && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.employee_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Position / Role<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    placeholder="Software Engineer"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.position && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.position}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Tax rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    name="tax_rate"
                    value={form.tax_rate}
                    onChange={handleChange}
                    placeholder="32"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Optional: can be refined later.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">
                    Active employee (included in future pay runs)
                  </span>
                </div>
              </div>
            </section>

            {/* Pay Settings */}
            <section className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Pay settings
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                Controls how this employee is included in pay runs.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Pay type
                  </label>
                  <div className="flex gap-3 text-xs">
                    {PAY_TYPES.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-1"
                      >
                        <input
                          type="radio"
                          name="pay_type"
                          value={opt.value}
                          checked={form.pay_type === opt.value}
                          onChange={handleChange}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Hourly rate (AUD)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="hourly_rate"
                    value={form.hourly_rate}
                    onChange={handleChange}
                    placeholder="40.00"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.hourly_rate && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.hourly_rate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Standard hours per week
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    name="standard_hours_per_week"
                    value={form.standard_hours_per_week}
                    onChange={handleChange}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Pay cycle
                  </label>
                  <select
                    name="pay_cycle"
                    value={form.pay_cycle}
                    onChange={handleChange}
                    className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {PAY_CYCLES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.pay_cycle && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.pay_cycle}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Bank Details */}
            <section className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Bank details
                  </h3>
                  <p className="mb-3 text-xs text-gray-500">
                    Optional. Required before exporting bank files, but you can
                    save the employee without it.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Bank code
                  </label>
                  <input
                    name="bank_code"
                    value={form.bank_code}
                    onChange={handleChange}
                    placeholder="e.g. ANZ, CBA"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    BSB
                  </label>
                  <input
                    name="bsb"
                    value={form.bsb}
                    onChange={handleChange}
                    placeholder="123-456"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.bsb && (
                    <p className="mt-1 text-xs text-red-500">{errors.bsb}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Account number
                  </label>
                  <input
                    name="account_number"
                    value={form.account_number}
                    onChange={handleChange}
                    placeholder="012345678"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.account_number && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.account_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Account name
                  </label>
                  <input
                    name="account_name"
                    value={form.account_name}
                    onChange={handleChange}
                    placeholder="Name as it appears on the account"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-6 py-3">
            <p className="text-xs text-gray-400">
              Fields marked <span className="text-red-500">*</span> are required.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save employee"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
