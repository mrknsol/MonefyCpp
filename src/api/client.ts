import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = '@monefy/apiToken';

export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://172.20.10.2:8080'
    : 'http://172.20.10.2:8080';

export async function setApiToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function getApiToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth !== false) {
    const token = await getApiToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed: ${response.status}`);
  }
  return payload as T;
}
