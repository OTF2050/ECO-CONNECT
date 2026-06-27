import React, { createContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';

export const AuthContext = createContext();

// Simple JWT parser fallback (decodes payload from base64 string)
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('eco_token') || null);
  const [user, setUser] = useState(null);
  const [name, setName] = useState(localStorage.getItem('eco_user_name') || '');
  const [status, setStatus] = useState(localStorage.getItem('eco_user_status') || 'active');
  const [isLoading, setIsLoading] = useState(true);
  const [ecoCredits, setEcoCredits] = useState(0);

  const refreshCredits = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/user/credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEcoCredits(data.eco_credits);
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  };

  const refreshStatus = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/user/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        localStorage.setItem('eco_user_status', data.status);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  // Dev/demo-only: instantly mark the current account as approved so onboarding
  // gates are bypassed during the hackathon demo (no backend round-trip).
  const simulateApproval = () => {
    setStatus('active');
    try {
      localStorage.setItem('eco_user_status', 'active');
    } catch {
      /* localStorage unavailable */
    }
  };

  useEffect(() => {
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
        refreshCredits();
        refreshStatus();
      } else {
        // Expired token
        logout();
      }
    } else {
      setEcoCredits(0);
      setStatus('active');
    }
    setIsLoading(false);
  }, [token]);

  const login = async (email, password) => {
    setIsLoading(true);
    // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('eco_token', data.access_token);
      localStorage.setItem('eco_user_name', data.name);
      localStorage.setItem('eco_user_status', data.status || 'active');
      
      setToken(data.access_token);
      setName(data.name);
      setStatus(data.status || 'active');
      const decoded = parseJwt(data.access_token);
      setUser(decoded);
      setIsLoading(false);
      return decoded.role; // Return role to allow instant routing redirect
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user_name');
    localStorage.removeItem('eco_user_status');
    setToken(null);
    setUser(null);
    setName('');
    setStatus('active');
    window.location.hash = '#/login';
  };

  return (
    <AuthContext.Provider value={{ token, user, name, status, refreshStatus, simulateApproval, login, logout, isLoading, ecoCredits, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
};
