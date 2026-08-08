export type AuthView = 'login' | 'register' | 'forgot-password';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

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
