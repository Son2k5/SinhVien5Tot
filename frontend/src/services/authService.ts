import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types/auth';
import { cookieStorage } from '../utils/cookieStorage';
import { sanitizeApiError } from './apiErrorSanitizer';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5080/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = cookieStorage.getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface AuthTokenResponse {
  accessToken: string;
  expiresAtUtc: string;
}

interface RegistrationStartedResponse {
  registrationId: string;
  message: string;
}

interface PasswordResetStartedResponse {
  resetId: string;
  message: string;
}

interface BackendUser {
  id: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
}

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = axios
      .post<AuthTokenResponse>(`${API_BASE}/auth/refresh-token`, {}, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      })
      .then((response) => {
        cookieStorage.setAuthToken(response.data.accessToken);
        return response.data.accessToken;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined;
    const isAuthenticationRequest =
      request?.url?.includes('/auth/login') ||
      request?.url?.includes('/auth/refresh-token');

    if (error.response?.status !== 401 || !request || request._retry || isAuthenticationRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const accessToken = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${accessToken}`;
      return api(request);
    } catch (refreshError: unknown) {
      cookieStorage.clearAllSession();
      return Promise.reject(refreshError);
    }
  },
);

function toUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.email.split('@')[0],
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

async function getCurrentUser(accessToken: string): Promise<User> {
  const response = await api.get<BackendUser>('/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return toUser(response.data);
}

export const authService = {
  async restoreSession(): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const storedToken = cookieStorage.getAuthToken();
      const token = storedToken || await refreshAccessToken();
      const user = await getCurrentUser(token);
      const currentToken = cookieStorage.getAuthToken() || token;
      return {
        success: true,
        message: 'Khôi phục phiên đăng nhập thành công.',
        data: { user, token: currentToken },
      };
    } catch {
      cookieStorage.clearAllSession();
      return { success: false, message: 'Phiên đăng nhập đã hết hạn.' };
    }
  },

  async login(payload: LoginPayload): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await api.post<AuthTokenResponse>('/auth/login', {
        email: payload.email,
        password: payload.password,
      });
      const user = await getCurrentUser(response.data.accessToken);

      if (payload.rememberMe) {
        cookieStorage.setSavedEmail(payload.email);
      } else {
        cookieStorage.removeSavedEmail();
      }

      return {
        success: true,
        message: 'Đăng nhập thành công!',
        data: { user, token: response.data.accessToken },
      };
    } catch (error: unknown) {
      return { success: false, message: sanitizeApiError(error) };
    }
  },

  async register(payload: RegisterPayload): Promise<ApiResponse<{ registrationId: string }>> {
    try {
      const response = await api.post<RegistrationStartedResponse>('/auth/register', {
        email: payload.email,
        password: payload.password,
      });
      return {
        success: true,
        message: response.data.message,
        data: { registrationId: response.data.registrationId },
      };
    } catch (error: unknown) {
      return { success: false, message: sanitizeApiError(error) };
    }
  },

  async verifyRegistration(
    registrationId: string,
    otp: string,
  ): Promise<ApiResponse> {
    try {
      const response = await api.post<{ message: string }>('/auth/verify-otp', {
        registrationId,
        otp,
      });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, message: sanitizeApiError(error) };
    }
  },

  async resendRegistrationOtp(registrationId: string): Promise<ApiResponse> {
    try {
      const response = await api.post<{ message: string }>('/auth/resend-otp', {
        registrationId,
      });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, message: sanitizeApiError(error) };
    }
  },

  async requestPasswordReset(email: string): Promise<ApiResponse<{ resetId: string }>> {
    try {
      const response = await api.post<PasswordResetStartedResponse>(
        '/auth/forgot-password',
        { email },
      );
      return {
        success: true,
        message: response.data.message,
        data: { resetId: response.data.resetId },
      };
    } catch (error: unknown) {
      return { success: false, message: sanitizeApiError(error) };
    }
  },

  async verifyPasswordResetOtp(resetId: string, otp: string): Promise<ApiResponse> {
    try {
      const response = await api.post<{ message: string }>('/auth/verify-reset-otp', {
        resetId,
        otp,
      });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, message: sanitizeApiError(error) };
    }
  },

  async resetPassword(
    resetId: string,
    otp: string,
    newPassword: string,
  ): Promise<ApiResponse> {
    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', {
        resetId,
        otp,
        newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, message: sanitizeApiError(error) };
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      cookieStorage.clearAllSession();
    }
  },

  getSavedEmail(): string {
    return cookieStorage.getSavedEmail() || '';
  },
};
