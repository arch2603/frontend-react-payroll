// Minimal mock / tiny wrapper. Replace with axios/fetch to your backend.
import axios from "axios";

// ROOT = http://host:port (no trailing /api here)
const ROOT = import.meta.env.VITE_API_URL || "http://192.168.1.120:5000";

// ---- Axios instances ----
export const authApi = axios.create({
  baseURL: ROOT,
  withCredentials: true,
});

export const api = axios.create({
  baseURL: `${ROOT}/api`,
  withCredentials: true,
});

// ---- Interceptors (Bearer token if available) ----
export function authHeader(config) {

    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config;
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(err);
  }
)

export const resetPasswordWithOtp = async ({ emailOrUsername, otp, password }) => {
  return authApi.post("/auth/reset-password-otp", { emailOrUsername, otp, password });
};
// ---------------------------------------------------------------------------

// ---- Pay Run API (full set) ----
export const payRunApi = {
  // Summary & items
  getCurrent: () => api.get("/pay-runs/current"),
  getSummary: () => api.get("/pay-runs/current/summary"),
  getItems: (params = { search: "", limit: 25, offset: 0 }) =>
    api.get("/pay-runs/current/items", { params }),

  // State transitions
  start: () => api.post("/pay-runs/current/start"),
  recalc: () => api.post("/pay-runs/current/recalculate"),
  approve: () => api.post("/pay-runs/current/approve"),
  post: () => api.post("/pay-runs/current/post"),

  // Item CRUD
  createItem: (payload) => api.post("/pay-runs/current/items", payload),
  patchItem: (id, patch) => api.patch(`/pay-runs/current/items/${id}`, patch),
  deleteItem: (id) => api.delete(`/pay-runs/current/items/${id}`),

  // Imports
  importTimesheets: (file, mapping) => {
    const formData = new FormData();
    formData.append("file", file);
    if (mapping) formData.append("mapping", JSON.stringify(mapping));
    return api.post("/timesheets/import", formData);
  },

  // Exports (payslips list, bank/super files as blob)
  getPayslips: () => api.get("/pay-runs/current/exports/payslips"),
  getBankFile: () => api.get("/pay-runs/current/exports/bank-file", { responseType: "blob" }),
  getSuperFile: () => api.get("/pay-runs/current/exports/super-file", { responseType: "blob" }),
};

// ---- Backward-compatible helpers ----

// You already had this; preserved as-is:
export async function patchLineHours(lineId, hours) {
  const { data } = await api.patch(`/pay-runs/current/items/${lineId}`, { hours });
  return data; // { item } optional
}

// Generic patch for multiple fields (hours, ot_hours, allowance, deductions)
export async function patchItemFields(id, patch) {
  const { data } = await api.patch(`/pay-runs/current/items/${id}`, patch);
  return data; // { item } optional
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