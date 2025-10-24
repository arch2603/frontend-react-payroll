// src/components/UserManagement.jsx
import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function UserManagement() {

  const { auth } = useAuth(); // <-- use auth, not user
  const role = (auth?.role || localStorage.getItem('role') || '').trim().toLowerCase();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'employee', employee_id: '' });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (role !== 'admin') return;
    fetchUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(()=>setLoading(false));
  }, [role]);

  if (role !== 'admin') {
    return <div className="p-4">Access denied. Admins only.</div>;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        username: form.username,
        password: form.password,
        role: form.role,
        employee_id: form.employee_id ? parseInt(form.employee_id,10) : null
      };
      const created = await createUser(payload);
      setUsers(prev => [created, ...prev]);
      setSuccessMsg('User created');
      setForm({ username: '', password: '', role: 'employee', employee_id: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">User Management (Admin)</h2>

      <div className="mb-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={form.username} onChange={e=>setForm({...form, username:e.target.value})} placeholder="Username" required className="p-2 border rounded"/>
          <input value={form.password} onChange={e=>setForm({...form, password:e.target.value})} placeholder="Password" type="password" required className="p-2 border rounded"/>
          <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="p-2 border rounded">
            <option value="employee">Employee</option>
            <option value="hr">HR</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <input value={form.employee_id} onChange={e=>setForm({...form, employee_id:e.target.value})} placeholder="Employee ID (optional)" className="p-2 border rounded"/>
          <div className="md:col-span-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create User</button>
            {successMsg && <span className="ml-3 text-green-600">{successMsg}</span>}
            {error && <span className="ml-3 text-red-600">{error}</span>}
          </div>
        </form>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Existing Users</h3>
        {loading ? <div>Loading...</div> : (
          <table className="min-w-full bg-white">
            <thead><tr className="bg-gray-100"><th className="p-2">Username</th><th className="p-2">Role</th><th className="p-2">Employee ID</th><th className="p-2">Created</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id ?? u.id ?? u.username } className="border-t">
                  <td className="p-2 text-center">{u.username}</td>
                  <td className="p-2 text-center">{u.role?.toUpperCase()}</td>
                  <td className="p-2 text-center">{u.employee_id || '-'}</td>
                  <td className="p-2 text-center">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

