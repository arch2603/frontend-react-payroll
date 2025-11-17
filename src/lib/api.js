// Minimal mock / tiny wrapper. Replace with axios/fetch to your backend.
import axios from "axios";

// ROOT = http://host:port (no trailing /api here)
const ROOT = import.meta.env.VITE_API_URL || "http://192.168.1.120:5000";
const API_BASE = `${ROOT}/api`;
const TOKEN_KEY = "token";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("role");
};

const isAuthError = (status) => status === 401 || status === 403;

const goLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

// ---- Axios instances ----
function makeClient(baseURL) {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 20000,
    exposedHeaders: ['Content-Disposition'],
  });

  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (err) => {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;

      if (status === 401 && (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID' || code === 'NO_AUTH_HEADER' || code === 'BAD_AUTH_SCHEME')) {
        try {
          localStorage.removeItem('jwt');
          window.location.assign('/login'); // or trigger your refresh flow here
          return;
        } finally{
          clearAuth();
          goLogin();
        }

      }
      return Promise.reject(err);
    }
  );
  return client;
}


export const authApi = makeClient(ROOT);     // /auth/... routes
export const api = makeClient(API_BASE); //

export const resetPasswordWithOtp = async ({ emailOrUsername, otp, password }) => {
  return authApi.post("/auth/reset-password-otp", { emailOrUsername, otp, password });
};
// ---------------------------------------------------------------------------

const unwarp = p => p.then(r => r.data);
// ---- Pay Run API (full set) ----
export const payRunApi = {
  // Summary & items
  getCurrent: () => api.get("/pay-runs/current"),
  getSummary: () => api.get("/pay-runs/current/summary"),
  getItems: (params = { search: "", limit: 25, offset: 0 }) =>
    api.get("/pay-runs/current/items", { params }),
  getValidation: () => api.get("/pay-runs/current/validation"),

  // State transitions
  start: () => api.post("/pay-runs/current/start"),
  recalc: () => api.post("/pay-runs/current/recalculate"),
  recalcItem: () => api.post("/pay-runs/current/recalculate"),
  approve: () => api.post("/pay-runs/current/approve"),
  post: () => api.post("/pay-runs/current/post"),
  updateStatus: (status, opts = {}) => api.patch('/pay-runs/current/status', { status, ...opts }),


  // Item CRUD
  createItem: (payload) => api.post("/pay-runs/current/items", payload),
  patchItem: async (id, patch) => {
    const { data } = await api.patch(`/pay-runs/current/items/${id}`, patch);
    return data?.line ?? data;
  },
  deleteItem: (id) => api.delete(`/pay-runs/current/items/${id}`),

  // Imports
  importTimesheets: (file, mapping) => {
    const formData = new FormData();
    formData.append("file", file);
    if (mapping) formData.append("mapping", JSON.stringify(mapping));
    return api.post("/timesheets/import", formData);
  },

  // Exports (payslips list, bank/super files as blob)
  getPayslipInlineView:(runId, employeeId) => api.get(`/pay-runs/current/${runId}/payslip/${employeeId}`, { responseType: "blob" }),
  getPayslipsById: (runId) => api.get(`/pay-runs/${runId}/export/payslips`, { responseType: "blob" }),
  getPayslips: () => api.get("/pay-runs/current/export/payslips", { responseType: "blob" }),
  getBankFile: (params) => api.get("/pay-runs/current/export/bank-file", { params, responseType: "blob" }),
  getSuperFile: () => api.get("/pay-runs/current/export/super-file", { responseType: "blob" }),
  stpPreview: () => api.get("/pay-runs/current/export/stp-preview"),
};

export const employeesApi = {
  createEmployee: (payload) => api.post("employees/create", payload),
  updateEmployee: (employeeId, payload) => api.patch(`employees/patch/${employeeId}`, payload)
};

// ---- Backward-compatible helpers ----
export async function patchLineHours(lineId, hours) {
  const { data } = await api.patch(`/pay-runs/current/items/${lineId}`, { hours });
  return data;
}

// Generic patch for multiple fields (hours, ot_hours, allowance, deductions)
export async function patchItemFields(id, patch) {
  const { data } = await api.patch(`/pay-runs/current/items/${id}`, patch);
  return data?.line ?? data;
}

// ---- Small utility to download blobs (bank/super files) ----
export function downloadBlob(blob, filename = "download") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const payPeriodApi = {
  list: () => api.get("/pay-periods"),
  create: (payload) => api.post("/pay-periods", payload),
  setCurrent: (id) => api.post(`/pay-periods/${id}/set-current`),
};