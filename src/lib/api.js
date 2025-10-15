// Minimal mock / tiny wrapper. Replace with axios/fetch to your backend.
const API_ROOT = '/api';

export async function fetchRecentPayslips() {
  // mock data
  return Promise.resolve([
    { id: 1, date: '2025-09-01', net: '$4,600.00' },
    { id: 2, date: '2025-08-01', net: '$4,550.00' },
  ]);
}

export async function fetchLeaveBalances() {
  return Promise.resolve({ annual: 12, sick: 8, bereavement: 5 });
}

export async function fetchUsers() {
  // connect to backend: GET /api/users
  // return fetch('/api/users', { headers: ... }).then(r => r.json());
  return Promise.resolve([
    { user_id: 1, username: 'admin', role: 'admin', created_at: new Date().toISOString() },
  ]);
}

export async function createUser(payload) {
  // POST /api/users
  // return fetch(...)...
  const created = { user_id: Date.now(), ...payload, created_at: new Date().toISOString() };
  return Promise.resolve(created);
}
