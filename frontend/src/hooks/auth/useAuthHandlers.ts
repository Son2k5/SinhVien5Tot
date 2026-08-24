import { useState } from 'react';
import { authService } from '../../services/authService';
import type { LoginPayload, RegisterPayload } from '../../types/auth';

/**
 * Quản lý toàn bộ OTP flow và các auth handlers cho AuthPage.
 * Trích xuất từ AuthPage.tsx để tách biệt logic khỏi UI.
 */
export function useAuthHandlers(
  onLoginSuccess: (user: Parameters<typeof authService.login>[0] extends Promise<infer R> ? R : never, token: string, rememberMe?: boolean) => void,
) {
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [purpose, setPurpose] = useState<'register' | 'reset-password'>('register');
  const [pendingRegistration, setPendingRegistration] = useState<RegisterPayload | null>(null);
  const [registrationId, setRegistrationId] = useState('');
  const [resetId, setResetId] = useState('');
  const [verifiedResetOtp, setVerifiedResetOtp] = useState('');

  const handleLogin = async (payload: LoginPayload) => {
    const result = await authService.login(payload);
    if (result.success && result.data?.user) {
      onLoginSuccess(result.data.user as never, result.data.token, payload.rememberMe);
      return { success: true, message: result.message };
    }
    return { success: false, message: result.message };
  };

  const handleRegister = async (payload: RegisterPayload) => {
    const result = await authService.register(payload);
    if (result.success && result.data?.registrationId) {
      setPendingRegistration(payload);
      setRegistrationId(result.data.registrationId);
      setOtpEmail(payload.email);
      setPurpose('register');
      setOtpOpen(true);
    }
    return { success: result.success, message: result.message };
  };

  const handleForgot = async (email: string) => {
    const result = await authService.requestPasswordReset(email);
    if (result.success && result.data?.resetId) {
      setResetId(result.data.resetId);
      setVerifiedResetOtp('');
      setOtpEmail(email);
      setPurpose('reset-password');
      setOtpOpen(true);
    }
    return { success: result.success, message: result.message };
  };

  const verifyOtp = async (otp: string) => {
    if (purpose === 'reset-password') {
      if (!resetId) {
        return { success: false, message: 'Yêu cầu đặt lại mật khẩu không hợp lệ. Vui lòng thực hiện lại.' };
      }
      const result = await authService.verifyPasswordResetOtp(resetId, otp);
      if (result.success) {
        window.setTimeout(() => {
          setOtpOpen(false);
          setVerifiedResetOtp(otp);
        }, 650);
      }
      return { success: result.success, message: result.message };
    }

    if (!registrationId) {
      return { success: false, message: 'Yêu cầu đăng ký không hợp lệ. Vui lòng thực hiện lại.' };
    }
    const result = await authService.verifyRegistration(registrationId, otp);
    if (result.success && pendingRegistration) {
      const loginResult = await authService.login({
        email: pendingRegistration.email,
        password: pendingRegistration.password,
        rememberMe: true,
      });
      if (!loginResult.success || !loginResult.data?.user) {
        return { success: false, message: loginResult.message };
      }
      window.setTimeout(
        () => onLoginSuccess(loginResult.data!.user as never, loginResult.data!.token, true),
        650,
      );
    }
    return {
      success: result.success,
      message: result.success
        ? 'Xác minh thành công! Đang mở hồ sơ của bạn...'
        : result.message,
    };
  };

  const resendOtp = async () => {
    if (purpose === 'register') {
      if (!registrationId) {
        return { success: false, message: 'Yêu cầu đăng ký không hợp lệ.' };
      }
      return authService.resendRegistrationOtp(registrationId);
    }
    const result = await authService.requestPasswordReset(otpEmail);
    if (result.success && result.data?.resetId) setResetId(result.data.resetId);
    return { success: result.success, message: result.message };
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetId || !verifiedResetOtp) {
      return { success: false, message: 'Phiên xác minh OTP không hợp lệ. Vui lòng thực hiện lại.' };
    }
    const result = await authService.resetPassword(resetId, verifiedResetOtp, newPassword);
    return { success: result.success, message: result.message };
  };

  const closeOtp = () => setOtpOpen(false);

  return {
    // OTP modal state
    otpOpen,
    otpEmail,
    purpose,
    verifiedResetOtp,
    closeOtp,
    // Handlers
    handleLogin,
    handleRegister,
    handleForgot,
    verifyOtp,
    resendOtp,
    handleResetPassword,
  };
}
