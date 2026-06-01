import { apiRequest, setApiToken } from './client';
import type { User } from '../context/AuthContext';

type AuthResponse = {
  token: string;
  user: User;
};

export async function apiLogin(email: string, password: string): Promise<User> {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  await setApiToken(response.token);
  return response.user;
}

export async function apiRegister(
  email: string,
  password: string,
  name: string,
): Promise<User> {
  const response = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: { email, password, name },
  });
  await setApiToken(response.token);
  return response.user;
}

export async function apiLogout(): Promise<void> {
  await setApiToken(null);
}
