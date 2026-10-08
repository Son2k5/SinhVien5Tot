import {
  axiosClient,
  clearApiAccessToken,
  refreshApiAccessToken,
  setApiAccessToken,
} from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import type {
  ApiResponse,
  AuthTokenResponse,
  BackendUser,
  LoginPayload,
  PasswordResetStartedResponse,
  RegisterPayload,
  RegistrationStartedResponse,
  User,
} from '../types/auth.types';

function toUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.displayName || user.email.split('@')[0],
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

async function getCurrentUser(accessToken: string): Promise<User> {
  const response = await axiosClient.get<BackendUser>(ENDPOINTS.AUTH.ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return toUser(response.data);
}

export const authService = {
  async restoreSession(): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const token = await refreshApiAccessToken();
      const user = await getCurrentUser(token);
      return {
        success: true,
        message: 'Khôi phục phiên đăng nhập thành công.',
        data: { user, token },
      };
    } catch {
      clearApiAccessToken();
      return { success: false, message: 'Phiên đăng nhập đã hết hạn.' };
    }
  },

  async login(payload: LoginPayload): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await axiosClient.post<AuthTokenResponse>(ENDPOINTS.AUTH.LOGIN, {
        email: payload.email,
        password: payload.password,
        rememberMe: payload.rememberMe ?? false,
      });
      setApiAccessToken(response.data.accessToken);
      const user = await getCurrentUser(response.data.accessToken);

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
      const response = await axiosClient.post<RegistrationStartedResponse>(ENDPOINTS.AUTH.REGISTER, {
        name: payload.name.trim(),
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
      const response = await axiosClient.post<{ message: string }>(ENDPOINTS.AUTH.VERIFY_OTP, {
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
      const response = await axiosClient.post<{ message: string }>('/auth/resend-otp', {
        registrationId,
      });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, message: sanitizeApiError(error) };
    }
  },

  async requestPasswordReset(email: string): Promise<ApiResponse<{ resetId: string }>> {
    try {
      const response = await axiosClient.post<PasswordResetStartedResponse>(
        ENDPOINTS.AUTH.FORGOT_PASSWORD,
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
      const response = await axiosClient.post<{ message: string }>('/auth/verify-reset-otp', {
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
      const response = await axiosClient.post<{ message: string }>(ENDPOINTS.AUTH.RESET_PASSWORD, {
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
      await axiosClient.post(ENDPOINTS.AUTH.LOGOUT);
    } finally {
      clearApiAccessToken();
    }
  },

  setAccessToken(token: string): void {
    setApiAccessToken(token);
  },

  clearAccessToken(): void {
    clearApiAccessToken();
  },

  getSavedEmail(): string {
    return '';
  },
};

export default authService;
