import { apiRequest } from './client';
import type { User } from '../context/AuthContext';

type ProfileResponse = {
  user: User;
};

export async function apiUpdatePhone(phone: string): Promise<User> {
  const response = await apiRequest<ProfileResponse>('/api/auth/profile', {
    method: 'PATCH',
    body: { phone },
  });
  return response.user;
}

export async function apiGetProfile(): Promise<User> {
  const response = await apiRequest<ProfileResponse>('/api/auth/profile', {
    method: 'GET',
  });
  return response.user;
}
