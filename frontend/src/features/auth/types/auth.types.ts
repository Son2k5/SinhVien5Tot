import axios from 'axios';
import type { ApiResponse } from '../../../types/api.types';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';

export type AuthView = 'login' | 'register' | 'forgot-password';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export type { ApiResponse };

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  expiresAtUtc: string;
}

export interface RegistrationStartedResponse {
  registrationId: string;
  message: string;
}

export interface PasswordResetStartedResponse {
  resetId: string;
  message: string;
}

export interface BackendUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
}

export class AuthApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.code = code;
  }
}

export function parseAuthApiError(err: unknown): AuthApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as { code?: string; detail?: string; message?: string } | undefined;
    const code = data?.code;
    const rawMessage = data?.detail || data?.message;
    const message = rawMessage && typeof rawMessage === 'string' ? rawMessage : sanitizeApiError(err);
    return new AuthApiError(message, status, code);
  }
  if (err instanceof AuthApiError) return err;
  return new AuthApiError(err instanceof Error ? err.message : 'Có lỗi xác thực xảy ra.');
}
