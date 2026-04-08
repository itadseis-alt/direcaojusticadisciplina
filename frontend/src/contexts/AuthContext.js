import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Session timeout in milliseconds (4 minutes)
const SESSION_TIMEOUT = 4 * 60 * 1000;

// Configure axios defaults
axios.defaults.withCredentials = true;

function formatApiErrorDetail(detail) {
  if (detail == null) return "Algo deu errado. Tente novamente.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = not authenticated, object = authenticated
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (user) {
      timeoutRef.current = setTimeout(() => {
        // Check if user has been inactive
        const inactiveTime = Date.now() - lastActivityRef.current;
        if (inactiveTime >= SESSION_TIMEOUT) {
          logout();
        }
      }, SESSION_TIMEOUT);
    }
  }, [user]);

  // Activity listeners
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      resetTimeout();
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial timeout setup
    resetTimeout();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, resetTimeout]);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(data);
    } catch (error) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(
        `${API}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(data);
      lastActivityRef.current = Date.now();
      return { success: true, user: data };
    } catch (error) {
      const message = formatApiErrorDetail(error.response?.data?.detail) || error.message;
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const verifyPassword = async (password) => {
    try {
      await axios.post(
        `${API}/auth/verify-password`,
        { password },
        { withCredentials: true }
      );
      return { success: true };
    } catch (error) {
      const message = formatApiErrorDetail(error.response?.data?.detail) || error.message;
      return { success: false, error: message };
    }
  };

  const canEdit = () => {
    return user && ['super_admin', 'admin', 'pessoal_justica'].includes(user.tipo);
  };

  const canDelete = () => {
    return user && user.tipo === 'super_admin';
  };

  const canManageUsers = () => {
    return user && ['super_admin', 'admin'].includes(user.tipo);
  };

  const canViewLogs = () => {
    return user && user.tipo === 'super_admin';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      verifyPassword,
      checkAuth,
      canEdit,
      canDelete,
      canManageUsers,
      canViewLogs,
      resetTimeout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
