'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { setAccessToken, setRefreshToken, clearTokens, getRefreshToken } from '@/lib/auth-token';
import { authService } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: any) => Promise<boolean>;
  logout: () => void;
  updateUserInState: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const refreshToken = getRefreshToken();

        if (storedUser && refreshToken) {
          // Request a new access token immediately using the refresh token
          try {
            const refreshRes = await authService.refresh(refreshToken);
            if (refreshRes.success && refreshRes.data.accessToken) {
              setAccessToken(refreshRes.data.accessToken);
              setUser(JSON.parse(storedUser));
            } else {
              logout();
            }
          } catch (e) {
            console.error('Session restore: token refresh failed', e);
            // If refresh fails, clear everything
            logout();
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.data) {
        const { accessToken, refreshToken, user: userData } = response.data;
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const register = async (payload: any): Promise<boolean> => {
    try {
      const response = await authService.register(payload);
      return response.success;
    } catch (err) {
      console.error('Registration error:', err);
      return false;
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUserInState = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUserInState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
