import React, { useEffect, useState } from 'react';
import { fetchUsers, createUser } from '../lib/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'employee' });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const created = await createUser(form);
      setUsers((s) => [created, ...s]);
      setForm({ username: '', password: '', role: 'employee' });
      setMsg('User created');
    } catch (err) {
      setMsg(err.message || 'Error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      <form onSubmit={submit} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="p-2 border rounded" placeholder="username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
        <input className="p-2 border rounded" placeholder="password" value={form.password} type="password" onChange={e => setForm({...form, password: e.target.value})} required />
        <select className="p-2 border rounded" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
          <option value="employee">Employee</option>
          <option value="hr">HR</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
      </form>

      {msg && <div className="mb-4 text-sm">{msg}</div>}

      <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} className="border-t">
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{new Date(u.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
