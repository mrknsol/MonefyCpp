import { apiRequest } from './client';
import type { User } from '../context/AuthContext';

type OkMessage = { ok: boolean; message: string; devCode?: string };

type UserResponse = { ok: boolean; user: User };

export async function apiForgotPasswordSendCode(email: string): Promise<OkMessage> {
  return apiRequest<OkMessage>('/api/auth/forgot-password/send-code', {
    method: 'POST',
    auth: false,
    body: { email: email.trim().toLowerCase() },
  });
}

export async function apiForgotPasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<OkMessage> {
  return apiRequest<OkMessage>('/api/auth/forgot-password/reset', {
    method: 'POST',
    auth: false,
    body: {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    },
  });
}

export async function apiChangePassword(
  oldPassword: string,
  newPassword: string,
): Promise<OkMessage> {
  return apiRequest<OkMessage>('/api/auth/change-password', {
    method: 'POST',
    body: { oldPassword, newPassword },
  });
}

export async function apiChangeEmailSendCode(newEmail: string): Promise<OkMessage> {
  return apiRequest<OkMessage>('/api/auth/change-email/send-code', {
    method: 'POST',
    body: { newEmail: newEmail.trim().toLowerCase() },
  });
}

export async function apiChangeEmailConfirm(
  newEmail: string,
  code: string,
): Promise<UserResponse> {
  return apiRequest<UserResponse>('/api/auth/change-email/confirm', {
    method: 'POST',
    body: {
      newEmail: newEmail.trim().toLowerCase(),
      code: code.trim(),
    },
  });
}
