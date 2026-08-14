import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { AuthView, LoginPayload, RegisterPayload, User } from '../types/auth';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { OtpModal } from '../components/auth/OtpModal';
import { BrandLogo, Icon } from '../components/common/BrandLogo';
import { authService } from '../services/authService';

interface AuthPageProps {
  view: AuthView;
  onLoginSuccess: (user: User, token: string, rememberMe?: boolean) => void;
}

const viewPath: Record<AuthView, string> = {
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
};

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85',
    badge: 'HÀNH TRÌNH 5 TỐT',
    title: 'Mỗi nỗ lực hôm nay là một dấu ấn của ngày mai.',
    text: 'Lưu giữ thành tích, theo dõi tiến độ và tự tin tiến gần hơn đến danh hiệu Sinh viên 5 Tốt.',
  },
  {
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1400&q=85',
    badge: 'KẾT NỐI & TRƯỞNG THÀNH',
    title: 'Cùng nhau tạo nên một thế hệ sinh viên toàn diện.',
    text: 'Kết nối hoạt động học tập, tình nguyện và hội nhập trên một nền tảng duy nhất.',
  },
  {
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=85',
    badge: 'RÈN LUYỆN MỖI NGÀY',
    title: 'Nhìn thấy tiến bộ để thêm động lực bước tiếp.',
    text: 'Mọi tiêu chí đều rõ ràng, mọi cột mốc đều được ghi nhận và bảo vệ an toàn.',
  },
];

export function AuthPage({ view, onLoginSuccess }: AuthPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [slide, setSlide] = useState(0);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [purpose, setPurpose] = useState<'register' | 'reset-password'>('register');
  const [pendingRegistration, setPendingRegistration] = useState<RegisterPayload | null>(null);
  const [registrationId, setRegistrationId] = useState('');
  const [resetId, setResetId] = useState('');
  const [verifiedResetOtp, setVerifiedResetOtp] = useState('');
  const sessionEndReason = searchParams.get('reason');

  useEffect(() => {
    const interval = window.setInterval(
      () => setSlide((value) => (value + 1) % slides.length),
      6500,
    );
    return () => window.clearInterval(interval);
  }, []);

  const switchView = (next: AuthView) => navigate(viewPath[next]);

  const handleLogin = async (payload: LoginPayload) => {
    const result = await authService.login(payload);
    if (result.success && result.data?.user) {
      onLoginSuccess(result.data.user, result.data.token, payload.rememberMe);
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
        () => onLoginSuccess(loginResult.data!.user, loginResult.data!.token, true),
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
    if (result.success) {
      window.setTimeout(() => navigate('/login'), 650);
    }
    return { success: result.success, message: result.message };
  };

  return (
    <div className="auth-shell">
      <header className="auth-header">
        <div className="auth-header__inner">
          <Link to="/" className="auth-header__brand" aria-label="Về trang chủ">
            <BrandLogo />
          </Link>
          <div className="auth-header__actions">
            <span className="auth-security-pill">
              <Icon name="shield" /> Kết nối được bảo mật
            </span>
            <Link className="auth-home-link" to="/">
              <Icon name="arrow-left" /> Trang chủ
            </Link>
          </div>
        </div>
      </header>

      <div className="auth-stage">
        <aside className="auth-story" aria-label="Thông tin về hành trình Sinh viên 5 Tốt">
          <div className="auth-story__halo" aria-hidden="true" />
          <div className="auth-story__dots" aria-hidden="true" />
          <div className="auth-story__media" aria-hidden="true">
            {slides.map((item, index) => (
              <img
                key={item.image}
                src={item.image}
                alt=""
                style={{
                  opacity: index === slide ? 1 : 0,
                  transform: index === slide ? 'scale(1.04)' : 'scale(1.12)',
                }}
              />
            ))}
          </div>
          <div className="auth-story__veil" aria-hidden="true" />
          <div className="auth-story__content">
            <span className="auth-story__badge">{slides[slide].badge}</span>
            <h2>{slides[slide].title}</h2>
            <p>{slides[slide].text}</p>
            <div className="auth-story__benefits">
              <span><Icon name="check" /> Xác minh qua email HANU</span>
              <span><Icon name="check" /> Theo dõi hành trình tập trung</span>
            </div>
            <div className="auth-slider-dots">
              {slides.map((item, index) => (
                <button
                  type="button"
                  key={item.badge}
                  className={index === slide ? 'is-active' : ''}
                  onClick={() => setSlide(index)}
                  aria-label={`Chuyển đến nội dung ${index + 1}`}
                  aria-current={index === slide ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
          <div className="auth-story__stamp" aria-hidden="true">
            <strong>5</strong>
            <span>tiêu chí<br />một hành trình</span>
          </div>
        </aside>

        <main className="auth-main">
          <div className="auth-card-frame" aria-hidden="true" />
          <section className="auth-card">
            <div className="auth-card__eyebrow">
              <span /> Cổng sinh viên trực tuyến
            </div>
            {view === 'login' && sessionEndReason && (
              <div className="auth-message auth-message--notice" role="status">
                <Icon name="shield" />
                <span>{sessionEndReason === 'inactive'
                  ? 'Phiên đăng nhập đã kết thúc sau 2 giờ không hoạt động. Vui lòng đăng nhập lại.'
                  : 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'}</span>
              </div>
            )}
            {view === 'login' && (
              <LoginForm onLogin={handleLogin} onSwitchView={switchView} />
            )}
            {view === 'register' && (
              <RegisterForm onRegister={handleRegister} onSwitchView={switchView} />
            )}
            {view === 'forgot-password' && !verifiedResetOtp && (
              <ForgotPasswordForm onRequestOtp={handleForgot} onSwitchView={switchView} />
            )}
            {view === 'forgot-password' && verifiedResetOtp && (
              <ResetPasswordForm
                email={otpEmail}
                onResetPassword={handleResetPassword}
                onBackToLogin={() => switchView('login')}
              />
            )}
          </section>
          <p className="auth-trust-note">
            <Icon name="lock" /> Thông tin của bạn được mã hóa và bảo vệ an toàn.
          </p>
        </main>
      </div>

      <footer className="auth-page-footer">
        <div className="auth-page-footer__inner">
          <span>© 2026 Sinh viên 5 Tốt · Trường Đại học Hà Nội</span>
          <div>
            <span>Bảo mật thông tin</span>
            <i aria-hidden="true" />
            <span>Hỗ trợ sinh viên</span>
          </div>
        </div>
      </footer>

      <OtpModal
        isOpen={otpOpen}
        email={otpEmail}
        onClose={() => setOtpOpen(false)}
        onVerify={verifyOtp}
        onResendOtp={resendOtp}
        title={purpose === 'register' ? 'Xác minh tài khoản' : 'Nhập OTP từ Outlook'}
      />
    </div>
  );
}
