/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, subscriptionAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshAccessStatus = async () => {
    try {
      const statusData = await subscriptionAPI.getStatus();
      setAccessStatus(statusData);
      return statusData;
    } catch (err) {
      console.error("Failed to fetch access status:", err);
      return null;
    }
  };

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
          // Fetch subscription details
          const statusData = await subscriptionAPI.getStatus();
          setAccessStatus(statusData);
        } catch (err) {
          console.error("Failed to restore session:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      // Load access status upon login
      try {
        const statusData = await subscriptionAPI.getStatus();
        setAccessStatus(statusData);
      } catch (subErr) {
        console.error("Failed to fetch access status after login:", subErr);
      }

      return data.user;
    } catch (err) {
      let errMsg = "Invalid credentials. Please check your inputs.";
      if (!err.response || err.code === 'ERR_NETWORK') {
        errMsg = "Cannot connect to the server. Please ensure the backend is running on port 8000.";
      } else if (err.response?.data?.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
      throw new Error(errMsg, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, fullName, password, role = 'user') => {
    setLoading(true);
    setError(null);
    try {
      await authAPI.register(email, fullName, password, role);
      // Automatically login after successful registration
      return await login(email, password);
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Registration failed. Try a different email.";
      setError(errMsg);
      throw new Error(errMsg, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAccessStatus(null);
  };

  const value = {
    user,
    accessStatus,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    refreshAccessStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

