import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiLogin, apiLogout, apiRegister } from '../api/auth';
import { getApiToken } from '../api/client';

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  password?: string;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER = 'user';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_USER);
      const token = await getApiToken();
      if (storedUser && token) {
        const userData = JSON.parse(storedUser) as User;
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      throw new Error('Заполните email и пароль');
    }

    const userData = await apiLogin(normalizedEmail, password);
    setUser(userData);
    await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData));
  };

  const register = async (email: string, password: string, name: string) => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedName = name.trim();

    if (!trimmedName || !normalizedEmail || !password) {
      throw new Error('Заполните все поля');
    }
    if (password.length < 6) {
      throw new Error('Пароль должен содержать минимум 6 символов');
    }

    const userData = await apiRegister(normalizedEmail, password, trimmedName);
    setUser(userData);
    await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_USER);
    await apiLogout();
  };

  const updateUser = async (patch: Partial<User>) => {
    const storedUser = await AsyncStorage.getItem(STORAGE_USER);
    if (!storedUser) {
      return;
    }
    const userData = { ...JSON.parse(storedUser), ...patch } as User;
    await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
