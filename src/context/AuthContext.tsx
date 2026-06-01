import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiLogin, apiLogout, apiRegister } from '../api/auth';
import { apiGetProfile } from '../api/profile';
import { getApiToken, setApiToken } from '../api/client';
import {
  getSavedAccount,
  removeSavedAccount,
  upsertSavedAccount,
} from '../services/savedAccounts';

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  password?: string;
  createdAt: string;
};

export type AuthScreen = 'login' | 'switch';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  authScreen: AuthScreen;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  beginSwitchAccount: () => Promise<void>;
  cancelSwitchAccount: () => void;
  loginWithSavedAccount: (accountId: string) => Promise<void>;
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
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');

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
        await upsertSavedAccount({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          token,
        });
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
    const token = await getApiToken();
    if (!token) {
      throw new Error('Не удалось сохранить сессию');
    }
    setUser(userData);
    setAuthScreen('login');
    await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData));
    await upsertSavedAccount({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      token,
    });
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
    const token = await getApiToken();
    if (!token) {
      throw new Error('Не удалось сохранить сессию');
    }
    setUser(userData);
    setAuthScreen('login');
    await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData));
    await upsertSavedAccount({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      token,
    });
  };

  const clearActiveSession = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_USER);
    await apiLogout();
  };

  const logout = async () => {
    if (user) {
      await removeSavedAccount(user.id);
    }
    await clearActiveSession();
    setAuthScreen('login');
  };

  const beginSwitchAccount = async () => {
    const token = await getApiToken();
    if (user && token) {
      await upsertSavedAccount({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        token,
      });
    }
    await clearActiveSession();
    setAuthScreen('switch');
  };

  const cancelSwitchAccount = () => {
    setAuthScreen('login');
  };

  const loginWithSavedAccount = async (accountId: string) => {
    const saved = await getSavedAccount(accountId);
    if (!saved?.token) {
      await removeSavedAccount(accountId);
      throw new Error('Сессия устарела, войдите с паролем');
    }

    await setApiToken(saved.token);
    try {
      const userData = await apiGetProfile();
      setUser(userData);
      setAuthScreen('login');
      await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData));
      await upsertSavedAccount({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        token: saved.token,
      });
    } catch {
      await removeSavedAccount(accountId);
      await apiLogout();
      throw new Error('Сессия устарела, войдите с паролем');
    }
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
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authScreen,
        login,
        register,
        logout,
        beginSwitchAccount,
        cancelSwitchAccount,
        loginWithSavedAccount,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
