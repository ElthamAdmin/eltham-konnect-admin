import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("ek_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("ek_token") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If token exists but user missing, force logout (safety)
    if (token && !user) {
      localStorage.removeItem("ek_token");
      setToken("");
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });

    const t = res.data.token;
    const u = res.data.data;

    localStorage.setItem("ek_token", t);
    localStorage.setItem("ek_user", JSON.stringify(u));

    setToken(t);
    setUser(u);

    return u;
  };

  const logout = () => {
    localStorage.removeItem("ek_token");
    localStorage.removeItem("ek_user");
    setToken("");
    setUser(null);
  };

  const refreshMyDuty = async () => {
    const res = await api.get("/api/auth/me/attendance-today");
    const updatedUser = res.data?.data?.user || user;

    // Update stored user duty status if backend changed
    if (updatedUser) {
      localStorage.setItem("ek_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }

    return res.data?.data;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      refreshMyDuty,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}