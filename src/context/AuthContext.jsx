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

  const logout = async () => {
  try {
    if (token) {
      await api.post("/api/auth/logout");
    }
  } catch (error) {
    console.error("Logout presence update failed:", error);
  } finally {
    localStorage.removeItem("ek_token");
    localStorage.removeItem("ek_user");
    setToken("");
    setUser(null);
  }
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

  const updatePresence = async (onlineStatus) => {
  const res = await api.post("/api/auth/presence", { onlineStatus });
  const updatedUser = res.data?.data || user;

  if (updatedUser) {
    localStorage.setItem("ek_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  return updatedUser;
};

useEffect(() => {
  if (!token || !user) return;

  const pingPresence = async () => {
    try {
      const res = await api.post("/api/auth/presence-ping");
      const updatedUser = res.data?.data || user;

      if (updatedUser) {
        localStorage.setItem("ek_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error("Presence ping failed:", error);
    }
  };

  pingPresence();

  const interval = setInterval(pingPresence, 120000);

  return () => clearInterval(interval);
}, [token, user?.userId]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      refreshMyDuty,
      updatePresence,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}