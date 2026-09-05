import axios from "axios";

const ROOT = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const API_BASE = ROOT ? `${ROOT}/api` : "/api";
const AUTH_BASE = ROOT || "";
const TOKEN_KEY = "payroll_access_token";

export const getAccessToken = () => sessionStorage.getItem(TOKEN_KEY);
export const clearAuthSession = () => sessionStorage.removeItem(TOKEN_KEY);
export const saveAccessToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);

function makeClient(baseURL) {
  const client = axios.create({ baseURL, timeout: 20000 });

  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    response => response,
    error => {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      if (status === 401 && ['TOKEN_EXPIRED', 'TOKEN_INVALID', 'NO_AUTH_HEADER', 'BAD_AUTH_SCHEME'].includes(code)) {
        clearAuthSession();
        if (window.location.pathname !== '/login') window.location.replace('/login');
      }
      return Promise.reject(error);
    }
  );
  return client;
}

export const authApi = makeClient(AUTH_BASE);
export const api = makeClient(API_BASE);

export const requestPasswordReset = payload => authApi.post('/auth/request-password-reset', payload);
export const requestPasswordOtp = payload => authApi.post('/auth/request-password-otp', payload);
export const resetPassword = payload => authApi.post('/auth/reset-password', payload);
export const resetPasswordWithOtp = ({ emailOrUsername, otp, password }) =>
  authApi.post('/auth/reset-password-otp', { emailOrUsername, otp, password });

export const payRunApi = {
  getCurrent: () => api.get('/pay-runs/current'),
  getSummary: () => api.get('/pay-runs/current/summary'),
  getItems: (params = { search: '', limit: 25, offset: 0 }) => api.get('/pay-runs/current/items', { params }),
  getValidation: () => api.get('/pay-runs/current/validation'),
  start: () => api.post('/pay-runs/current/start'),
  recalc: () => api.post('/pay-runs/current/recalculate'),
  recalcItem: (id) => api.patch(`/pay-runs/current/items/${id}`, { _recalc: true }),
  approve: () => api.post('/pay-runs/current/approve'),
  post: () => api.post('/pay-runs/current/post'),
  reopen: () => api.post('/pay-runs/current/reopen'),
  createItem: payload => api.post('/pay-runs/current/items', payload),
  patchItem: async (id, patch) => {
    const { data } = await api.patch(`/pay-runs/current/items/${id}`, patch);
    return data?.line ?? data;
  },
  deleteItem: id => api.delete(`/pay-runs/current/items/${id}`),
  importTimesheets: file => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pay-runs/current/import-timesheets', formData);
  },
  getPayslipInlineView: (runId, employeeId) =>
    api.get(`/pay-runs/current/${runId}/payslip/${employeeId}`, { responseType: 'blob' }),
  getPayslipsById: runId => api.get(`/pay-runs/${runId}/export/payslips`, { responseType: 'blob' }),
  getPayslips: () => api.get('/pay-runs/current/export/payslips', { responseType: 'blob' }),
  getBankFile: params => api.get('/pay-runs/current/export/bank-file', { params, responseType: 'blob' }),
  getSuperFile: () => api.get('/pay-runs/current/export/super-file', { responseType: 'blob' }),
  stpPreview: () => api.get('/pay-runs/current/export/stp-preview'),
  getCurrentSamoaSummary: () => api.get('/pay-runs/current/samoa-summary'),
  getSamoaSummaryByRunId: runId => api.get(`/pay-runs/${runId}/samoa-summary`),
};

export const employeesApi = {
  getEmployeeById: id => api.get(`/employees/${id}`),
  createEmployee: payload => api.post('/employees/create', payload),
  updateEmployee: (employeeId, payload) => api.patch(`/employees/patch/${employeeId}`, payload),
};

const unwrap = promise => promise.then(response => response.data);
export const fetchUsers = async () => {
  const data = await unwrap(api.get('/users'));
  return Array.isArray(data.items) ? data.items : [];
};
export const createUser = payload => unwrap(api.post('/users', payload));
export const updateUser = (userId, payload) => unwrap(api.patch(`/users/${userId}`, payload));

export async function patchLineHours(lineId, hours) {
  const { data } = await api.patch(`/pay-runs/current/items/${lineId}`, { hours });
  return data;
}

export async function patchItemFields(id, patch) {
  const { data } = await api.patch(`/pay-runs/current/items/${id}`, patch);
  return data?.line ?? data;
}

export function downloadBlob(blob, filename = 'download') {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const payPeriodApi = {
  list: () => api.get('/pay-periods'),
  create: payload => api.post('/pay-periods', payload),
  setCurrent: id => api.post(`/pay-periods/${id}/set-current`),
};
