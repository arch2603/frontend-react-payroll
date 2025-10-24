// Minimal mock / tiny wrapper. Replace with axios/fetch to your backend.
import axios from "axios";

//const API_ROOT = '/api';
const ROOT = import.meta.env.VITE_API_URL || "http://192.168.1.120:5000";

export const authApi = axios.create({
  baseURL: ROOT,
  withCredentials: true
});

export const api = axios.create({
  baseURL: `${ROOT}/api`,
  withCredentials: true,
});


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

export function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}



export async function fetchRecentPayslips(limit = 5) {
  const { data } = await api.get("/payslips/recent", { params: { limit } });
  return Array.isArray(data) ? data : data.items ?? [];
}

export async function fetchLeaveBalances() {
  return Promise.resolve({ annual: 12, sick: 8, bereavement: 5 });
}

export async function fetchUsers() {
  const { data } = await api.get("/users");
  // Expect { items: [...] }
  return data.items ?? [];
}

export async function createUser(payload) {
  const created = { user_id: Date.now(), ...payload, created_at: new Date().toISOString() };
  return Promise.resolve(created);
}

export async function loginUser({ username, password }) {
  const { data } = await authApi.post("/auth/login", { username, password });
  // data: { token, role, user? }
  return data;
}

export const requestPasswordReset = async (email) => {
  return authApi.post("/auth/request-password-reset", {email});
}

export const resetPassword = async ({ token, password }) => {
  return authApi.post("/auth/reset-password", { token, password });
};

export const requestPasswordOtp = async (emailOrUsername) => {
  return authApi.post("/auth/request-password-otp", emailOrUsername);
};

export const resetPasswordWithOtp = asyn = ({ emailOrUsername, otp, password}) => {
  return authApi.post("/auth/reset-password-otp", {emailOrUsername, otp, password});
};

