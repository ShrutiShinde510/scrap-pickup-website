import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("login/", { email, password });

      const { access, refresh, user } = res.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      return { success: true };
    } catch (error) {
      console.error("Login Error:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Login failed",
      };
    }
  };

  const register = async (type, data) => {
    try {
      const res = await api.post(`register/${type}/`, data);

      const { access, refresh, user } = res.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      return { success: true };
    } catch (error) {
      console.error("Registration Error:", error);
      return { success: false, error: error.response?.data };
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
