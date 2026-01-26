import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";
import { clearCsrfToken } from "../api/client.js";

const AuthContext = createContext(null);
const USER_KEY = "xdsec_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me();
      const stored = window.localStorage.getItem(USER_KEY);
      const cached = stored ? JSON.parse(stored) : null;
      const current = data?.data?.user || null;
      const merged =
        current && cached && cached.email === current.email
          ? { ...cached, ...current }
          : current;
      setUser(merged);
      if (merged) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(merged));
      }
    } catch (error) {
      setUser(null);
      clearCsrfToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (payload) => {
    const data = await authApi.login(payload);
    const nextUser = data?.data?.user || null;
    setUser(nextUser);
    if (nextUser) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    window.localStorage.removeItem(USER_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      login,
      logout
    }),
    [user, loading, refresh, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
