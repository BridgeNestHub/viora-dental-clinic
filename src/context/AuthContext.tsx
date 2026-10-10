import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client.js';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: 'super_admin' | 'doctor_manager' | 'receptionist' | 'doctor';
  doctorId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: {
    username?: string;
    fullName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('viora_auth_token');
    const savedUser = localStorage.getItem('viora_auth_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with /auth/me
        apiClient
          .get('/auth/me')
          .then((res) => {
            if (res.data?.success && res.data.data) {
              setUser(res.data.data);
              localStorage.setItem('viora_auth_user', JSON.stringify(res.data.data));
            }
          })
          .catch(() => {
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiClient.post('/auth/login', { username, password });
      if (res.data?.success) {
        const { token: receivedToken, user: receivedUser } = res.data.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('viora_auth_token', receivedToken);
        localStorage.setItem('viora_auth_user', JSON.stringify(receivedUser));
        return { success: true };
      }
      return { success: false, message: 'Invalid server response' };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('viora_auth_token');
    localStorage.removeItem('viora_auth_user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: {
    username?: string;
    fullName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    try {
      const res = await apiClient.put('/auth/profile', data);
      if (res.data?.success) {
        const updated = res.data.data;
        setUser((prev) => (prev ? { ...prev, ...updated } : null));
        localStorage.setItem('viora_auth_user', JSON.stringify({ ...user, ...updated }));
        return { success: true };
      }
      return { success: false, message: 'Could not update profile' };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to update credentials';
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
