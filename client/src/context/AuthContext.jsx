import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('railway_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('railway_token');
      const storedUser = localStorage.getItem('railway_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with profile endpoint
          const res = await api.get('/auth/profile');
          setUser(res.data);
          localStorage.setItem('railway_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired or server unavailable:', err.message);
          // If network error, keep offline state; if 401 clear
          if (err.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, ...userData } = res.data;
    localStorage.setItem('railway_token', receivedToken);
    localStorage.setItem('railway_user', JSON.stringify(userData));
    setToken(receivedToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, phone) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    const { token: receivedToken, ...userData } = res.data;
    localStorage.setItem('railway_token', receivedToken);
    localStorage.setItem('railway_user', JSON.stringify(userData));
    setToken(receivedToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('railway_token');
    localStorage.removeItem('railway_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data);
      localStorage.setItem('railway_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Refresh profile error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
