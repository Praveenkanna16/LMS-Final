import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; user: User; token: string; error?: string }>;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; user: User; token: string; error?: string }>;
  logout: () => void;
  loading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    checkAuth: storeCheckAuth,
  } = useAuthStore();

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check authentication on app load
    console.log('🔍 AuthProvider: Initializing authentication check...');
    const initAuth = async () => {
      try {
        await storeCheckAuth();
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [storeCheckAuth]);

  const login = async (email: string, password: string) => {
    try {
      const response = await storeLogin(email, password);
      return { success: true, user: response.user, token: response.token };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { success: false, user: {} as User, token: '', error: error.message };
    }
  };

  const register = async (userData: RegisterData) => {
    console.log('🔐 AuthContext: Register called with:', userData);
    try {
      const response = await storeRegister(userData);
      console.log('✅ AuthContext: Registration successful:', response);
      return { success: true, user: response.user, token: response.token };
    } catch (error: any) {
      console.error('❌ AuthContext: Registration failed:', error);
      return { success: false, user: {} as User, token: '', error: error.message };
    }
  };

  const logout = () => {
    storeLogout();
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading: isLoading,
    isInitializing,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
