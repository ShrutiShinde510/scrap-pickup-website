import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        localStorage.removeItem("user");
      }
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

      console.log("AuthContext: Login successful. User:", user);
      setUser(user);
      return { success: true, user };
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
      // Explicitly unset Content-Type for FormData so browser sets the boundary.
      // This overrides any global/instance defaults that might be set to application/json.
      const config = data instanceof FormData
        ? { headers: { "Content-Type": undefined } }
        : {};

      const res = await api.post(`register/${type}/`, data, config);

      const { access, refresh, user } = res.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      return { success: true, user };
    } catch (error) {
      console.error("Registration Error:", error);
      return { success: false, error: error.response?.data };
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isLoading: loading,
    isAuthenticated: !!user,
    isVerified: user?.is_phone_verified || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
