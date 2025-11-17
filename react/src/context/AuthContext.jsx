import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { login as apiLogin } from '../api/auth.jsx';
import { getMe } from '../api/me.jsx';

export const AuthContext = createContext({
  token: null,
  me: null,
  login: async () => {},
  logout: () => {},
  loadMe: async () => {},
});

function safeGetToken() {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    return null;
  }
}

function safeSetToken(token) {
  try {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  } catch (e) {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => safeGetToken());
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(false);

  const loadMe = useCallback(async () => {
    if (!token) {
      setMe(null);
      return null;
    }
    setLoadingMe(true);
    try {
      const data = await getMe();
      setMe(data);
      return data;
    } catch (e) {
      // token invalid or request failed
      setMe(null);
      return null;
    } finally {
      setLoadingMe(false);
    }
  }, [token]);

  const login = useCallback(async (username, password) => {
    const { token: newToken } = await apiLogin({ username, password });
    setToken(newToken);
    safeSetToken(newToken);
    const user = await loadMe();
    return { token: newToken, me: user };
  }, [loadMe]);

  const logout = useCallback(() => {
    setToken(null);
    setMe(null);
    safeSetToken(null);
  }, []);

  useEffect(() => {
    if (token && !me && !loadingMe) {
      loadMe();
    }
  }, [token, me, loadingMe, loadMe]);

  const value = useMemo(() => ({ token, me, login, logout, loadMe }), [token, me, login, logout, loadMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  return ctx;
}
