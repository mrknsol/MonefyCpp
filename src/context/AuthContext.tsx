import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MonefyCore } from '../native/monefyCore';

export type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER = 'user';
const STORAGE_USERS = 'registered_users';
const STORAGE_DEMO_SEEDED = 'demo_users_seeded';

const DEMO_USERS: User[] = [
  {
    id: 'demo-1',
    email: 'user1@monefy.com',
    name: 'User One',
    password: 'demo123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    email: 'user2@monefy.com',
    name: 'User Two',
    password: 'demo123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    email: 'demo@monefy.com',
    name: 'Demo User',
    password: 'demo123',
    createdAt: new Date().toISOString(),
  },
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function loadRegisteredUsers(): Promise<User[]> {
  const usersJson = await AsyncStorage.getItem(STORAGE_USERS);
  return usersJson ? (JSON.parse(usersJson) as User[]) : [];
}

async function saveRegisteredUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

async function ensureDemoUsersOnce(): Promise<User[]> {
  let users = await loadRegisteredUsers();
  const seeded = await AsyncStorage.getItem(STORAGE_DEMO_SEEDED);
  if (!seeded) {
    const existingEmails = new Set(users.map(u => normalizeEmail(u.email)));
    for (const demo of DEMO_USERS) {
      if (!existingEmails.has(demo.email)) {
        users.push(demo);
      }
    }
    await saveRegisteredUsers(users);
    await AsyncStorage.setItem(STORAGE_DEMO_SEEDED, '1');
  }
  return users;
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
      if (storedUser) {
        const userData = JSON.parse(storedUser) as User;
        await MonefyCore.clearUserData();
        await MonefyCore.setUserId(userData.id);
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

    await new Promise<void>(resolve => setTimeout(resolve, 300));

    const users = await ensureDemoUsersOnce();
    const existingUser = users.find(u => normalizeEmail(u.email) === normalizedEmail);

    if (!existingUser || existingUser.password !== password) {
      throw new Error('Неверный email или пароль');
    }

    await MonefyCore.clearUserData();
    await MonefyCore.setUserId(existingUser.id);
    setUser(existingUser);
    await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(existingUser));
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

    await new Promise<void>(resolve => setTimeout(resolve, 300));

    const users = await ensureDemoUsersOnce();
    if (users.some(u => normalizeEmail(u.email) === normalizedEmail)) {
      throw new Error('Пользователь с таким email уже существует');
    }

    const userData: User = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      name: trimmedName,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(userData);
    await saveRegisteredUsers(users);

    await MonefyCore.clearUserData();
    await MonefyCore.setUserId(userData.id);
    setUser(userData);
    await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_USER);
    await MonefyCore.clearUserData();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
