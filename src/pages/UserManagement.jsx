import React, { useEffect, useState, useMemo } from "react";
import { fetchUsers, createUser, updateUser } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function UserManagement() {
  const { auth } = useAuth();
  const role = (auth?.role || localStorage.getItem("role") || "")
    .trim()
    .toLowerCase();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "employee",
    employee_id: "",
  });

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // UX extras
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    role: "employee",
    employee_id: "",
    password: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  const openEdit = (user) => {
    setEditingUser(user);
    setEditError(null);
    setEditForm({
      username: user.username || "",
      role: (user.role || "employee").toLowerCase(),
      employee_id: user.employee_id || "",
      password: "",
    });
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditError(null);
    setEditForm({
      username: "",
      role: "employee",
      employee_id: "",
      password: "",
    });
  };

  const handleEditChange = (field) => (e) => {
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  useEffect(() => {
    if (role !== "admin") return;
    setLoading(true);
    fetchUsers()
      .then((data) => {
        // Normalise to array, in case API returns object or null
        setUsers(Array.isArray(data) ? data : data?.users || []);
      })
      .catch((err) => setError(err.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, [role]);

  if (role !== "admin") {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Access denied</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Only <span className="font-semibold">Admin</span> users can manage
            application accounts.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        employee_id: form.employee_id
          ? parseInt(form.employee_id, 10)
          : null,
      };

      const created = await createUser(payload);
      setUsers((prev) => [created, ...(prev || [])]);
      setSuccessMsg("User created successfully");
      setForm({
        username: "",
        password: "",
        role: "employee",
        employee_id: "",
      });
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      const payload = {
        username: editForm.username.trim(),
        role: editForm.role,
        employee_id: editForm.employee_id
          ? parseInt(editForm.employee_id, 10)
          : null,
      };

      if (editForm.password) {
        payload.password = editForm.password;
      }

      const id = editingUser.user_id ?? editingUser.id;
      const updated = await updateUser(id, payload);

      // Patch into users list
      setUsers((prev) =>
        (prev || []).map((u) => {
          const uid = u.user_id ?? u.id;
          return uid === id ? { ...u, ...updated } : u;
        })
      );

      closeEdit();
    } catch (err) {
      setEditError(err.message || "Failed to update user");
    } finally {
      setEditSubmitting(false);
    }
  };


  const filteredUsers = useMemo(() => {
    let list = Array.isArray(users) ? users : [];
    if (roleFilter !== "all") {
      list = list.filter(
        (u) => (u.role || "").toLowerCase() === roleFilter.toLowerCase()
      );
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.username?.toLowerCase().includes(term) ||
          String(u.employee_id || "").includes(term)
      );
    }
    return list;
  }, [users, roleFilter, search]);

  const roleBadgeClass = (r) => {
    const base =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    const normalized = (r || "").toLowerCase();
    if (normalized === "admin")
      return `${base} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-100`;
    if (normalized === "hr")
      return `${base} bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-100`;
    if (normalized === "manager")
      return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100`;
    return `${base} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            User Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Create and manage login accounts for employees, HR, managers, and
            admins.
          </p>
        </div>
        <div className="text-xs uppercase tracking-wide text-gray-500">
          Admin console
        </div>
      </div>

      {/* Layout: form + list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create user card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Create new user</h3>
              <p className="text-xs text-gray-500 mt-1">
                Link a login to an employee record and assign an appropriate
                role.
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                {successMsg}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Username
                </label>
                <input
                  value={form.username}
                  onChange={handleChange("username")}
                  placeholder="e.g. jsmith"
                  required
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  This is what the user will type on the login screen.
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Temporary password
                </label>
                <input
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Set a temporary password"
                  type="password"
                  required
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Ask the user to change this on first login (future feature).
                </p>
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={handleChange("role")}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500">
                  Controls what the user can see and do in the system.
                </p>
              </div>

              {/* Employee ID */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Employee ID
                  <span className="text-xs font-normal text-gray-500 ml-1">
                    (optional)
                  </span>
                </label>
                <input
                  value={form.employee_id}
                  onChange={handleChange("employee_id")}
                  placeholder="Link to existing employee record"
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  If set, this user account will be associated with that
                  employee.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-white ${submitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                  } focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500`}
              >
                {submitting ? "Creating..." : "Create user"}
              </button>
            </form>
          </div>
        </div>

        {/* Users list card */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Existing users</h3>
                <p className="text-xs text-gray-500">
                  {Array.isArray(users) && users.length > 0
                    ? `Total: ${users.length} users`
                    : "No users found yet."}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by username or employee ID..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="sm:w-40 px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                >
                  <option value="all">All roles</option>
                  <option value="employee">Employees</option>
                  <option value="hr">HR</option>
                  <option value="manager">Managers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {/* Table / states */}
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Loading users…
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                No users match your current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 rounded-tl-lg border-b border-gray-200 dark:border-gray-700">
                        Username
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        Role
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        Employee ID
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 rounded-tr-lg border-b border-gray-200 dark:border-gray-700">
                        Created
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 rounded-tr-lg border-b border-gray-200 dark:border-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => (
                      <tr
                        key={u.user_id ?? u.id ?? u.username ?? idx}
                        className={
                          idx % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-950/60"
                        }
                      >
                        <td className="px-3 py-2 align-middle">
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {u.username}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <span className={roleBadgeClass(u.role)}>
                            {(u.role || "").toUpperCase() || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-middle text-gray-700 dark:text-gray-200">
                          {u.employee_id || "—"}
                        </td>
                        <td className="px-3 py-2 align-middle text-gray-600 dark:text-gray-300">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-3 py-2 align-middle text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-1">
              Edit user: <span className="font-mono">{editingUser.username}</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Update role, employee link, or reset password.
            </p>

            {editError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-3">
                {editError}
              </div>
            )}

            <form onSubmit={submitEdit} className="space-y-3">
              {/* Username */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Username
                </label>
                <input
                  value={editForm.username}
                  onChange={handleEditChange("username")}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={handleEditChange("role")}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Employee ID */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Employee ID
                </label>
                <input
                  value={editForm.employee_id}
                  onChange={handleEditChange("employee_id")}
                  placeholder="Link to existing employee record"
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                />
              </div>

              {/* New password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  New password
                  <span className="text-xs font-normal text-gray-500 ml-1">
                    (optional)
                  </span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={handleEditChange("password")}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className={`px-4 py-2 text-sm font-medium rounded-md text-white ${editSubmitting
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                    } focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500`}
                >
                  {editSubmitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
