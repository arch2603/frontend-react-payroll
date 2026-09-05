import { createContext, useContext, useMemo, useState } from 'react';
import { clearAuthSession, getAccessToken, saveAccessToken } from '../lib/api';

export const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const encoded = token.split('.')[1];
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function initialAuth() {
  const token = getAccessToken();
  if (!token) return null;
  const claims = decodeToken(token);
  if (!claims?.exp || claims.exp * 1000 <= Date.now()) {
    clearAuthSession();
    return null;
  }
  return { token, role: String(claims.role || '').toLowerCase(), user: claims };
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(initialAuth);

  const value = useMemo(() => ({
    auth,
    login(token) {
      const claims = decodeToken(token);
      if (!claims?.role || !claims?.exp) throw new Error('Invalid login token');
      saveAccessToken(token);
      setAuth({ token, role: String(claims.role).toLowerCase(), user: claims });
    },
    logout() {
      clearAuthSession();
      setAuth(null);
    },
  }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
