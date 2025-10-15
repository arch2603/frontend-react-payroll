import Layout from "../components/Layout";

export default function AdminDashboard() {
  return (
   <>
      <h2 className="text-2xl font-bold text-primary mb-4">Admin Dashboard</h2>
      <p className="text-neutral-dark mb-6">
        Manage users, assign roles, and oversee payroll operations.
      </p>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold mb-2">Users</h3>
          <p className="text-neutral">Add and manage system users.</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold mb-2">Payroll</h3>
          <p className="text-neutral">Generate and review payroll records.</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold mb-2">Reports</h3>
          <p className="text-neutral">View salary reports and employee performance.</p>
        </div>
      </div>
    </>
  );
}
