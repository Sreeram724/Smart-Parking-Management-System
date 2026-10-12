import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("parkpulse_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setCurrentUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn("Session restore failed, clearing token.");
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem("parkpulse_token", res.token);
      setToken(res.token);
      setCurrentUser(res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      localStorage.setItem("parkpulse_token", res.token);
      setToken(res.token);
      setCurrentUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem("parkpulse_token");
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        role: currentUser?.role || "driver",
        login,
        register,
        logout,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
