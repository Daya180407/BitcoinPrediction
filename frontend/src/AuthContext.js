import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const updateWalletBalance = useCallback((balance) => {
    setWallet(prev => ({ ...prev, balance }));
  }, []);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      setWallet(data.wallet);
      setIsAuthenticated(true);
      initSocket(token);
    } catch {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setWallet(data.wallet);
    setIsAuthenticated(true);
    initSocket(data.token);
    return data;
  };

  const signup = async (userData) => {
    const { data } = await authAPI.signup(userData);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setWallet(data.wallet);
    setIsAuthenticated(true);
    initSocket(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setWallet({ balance: 0 });
    setIsAuthenticated(false);
    disconnectSocket();
  };

  const refreshUser = () => fetchMe();

  return (
    <AuthContext.Provider value={{
      user, wallet, loading, isAuthenticated,
      login, signup, logout, refreshUser, updateWalletBalance
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
