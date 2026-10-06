import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandLogo, Icon } from '../components/common/BrandLogo';
import { SiteFooter } from '../components/common/SiteFooter';
import {
  AUTH_SLIDES,
  AuthStoryAside,
  ForgotPasswordForm,
  LoginForm,
  OtpModal,
  RegisterForm,
  ResetPasswordForm,
  useAuthHandlers,
  useSlideshow,
  type AuthView,
  type User,
} from '../features/auth';

interface AuthPageProps {
  view: AuthView;
  onLoginSuccess: (user: User, token: string, rememberMe?: boolean) => void;
}

const viewPath: Record<AuthView, string> = {
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
};

export function AuthPage({ view, onLoginSuccess }: AuthPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { slide, setSlide } = useSlideshow(AUTH_SLIDES.length);
  const sessionEndReason = searchParams.get('reason');

  const {
    otpOpen,
    otpEmail,
    verifiedResetOtp,
    closeOtp,
    handleLogin,
    handleRegister,
    handleForgot,
    verifyOtp,
    resendOtp,
    handleResetPassword,
  } = useAuthHandlers(onLoginSuccess);

  const switchView = (next: AuthView) => navigate(viewPath[next]);

  return (
    <div className={`relative isolate flex min-h-dvh w-full flex-col overflow-x-hidden bg-[radial-gradient(circle_at_7%_18%,_rgba(83,_202,_255,_.2),_transparent_26%),_radial-gradient(circle_at_92%_74%,_rgba(119,_99,_255,_.12),_transparent_24%),_linear-gradient(145deg,_#f8fcff_0%,_#eef7ff_48%,_#f7f5ff_100%)] before:content-[''] before:absolute before:z-[-1] before:inset-0 before:opacity-[.38] before:bg-[image:linear-gradient(rgba(31,_127,_231,_.06)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(31,_127,_231,_.06)_1px,_transparent_1px)] before:bg-[length:44px_44px] before:[mask-image:linear-gradient(115deg,_#000,_transparent_36%,_#000)] after:content-[''] after:absolute after:z-[-1] after:right-[-110px] after:top-[120px] after:w-[310px] after:h-[310px] after:border after:border-[rgba(35,_126,_232,_.16)] after:rounded-[46%_54%_38%_62%_/_58%_35%_65%_42%] after:shadow-[0_0_0_42px_rgba(30,_139,_245,_.035),_0_0_0_84px_rgba(30,_139,_245,_.02)] after:transform-[rotate(17deg)]`}>
      <header className={`relative z-[20] flex-none border-b border-b-[rgba(184,_211,_239,_.7)] bg-[rgba(250,_253,_255,_.76)] backdrop-blur-[18px] [&_.brand-logo__copy_strong]:text-[#12345a] [&_.brand-logo__copy_strong]:text-[16px] [&_.brand-logo__copy_small]:text-[#66809b] [&_.brand-logo__copy_small]:text-[9px] max-[640px]:[&_.brand-logo__mark]:w-[42px] max-[640px]:[&_.brand-logo__mark]:h-[42px] max-[640px]:[&_.brand-logo__copy_strong]:text-[14px] max-[640px]:[&_.brand-logo__copy_small]:hidden`}>
        <div className={`w-[min(1260px,_calc(100%_-_64px))] mx-auto min-h-[84px] flex items-center justify-between gap-[28px] max-[900px]:w-[min(720px,_calc(100%_-_40px))] max-[640px]:w-[calc(100%_-_28px)] max-[640px]:min-h-[72px]`}>
          <Link to="/" className={`rounded-[14px] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.3)] focus-visible:outline-offset-[4px]`} aria-label="Về trang chủ">
            <BrandLogo />
          </Link>
          <div className={`flex items-center gap-[12px]`}>
            <span className={`inline-flex items-center gap-[8px] min-h-[40px] p-[0_14px] rounded-[999px] text-[12px] font-bold text-[#27735f] border border-[#c9eadf] bg-[rgba(238,_251,_247,_.86)] [&_svg]:w-[16px] max-[640px]:hidden`}>
              <Icon name="shield" /> Kết nối được bảo mật
            </span>
            <Link className={`auth-home-link focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.3)] focus-visible:outline-offset-[4px] inline-flex items-center gap-[8px] min-h-[40px] p-[0_14px] rounded-[999px] text-[12px] font-bold text-[#34516f] border border-[#d4e2f0] bg-[rgba(255,_255,_255,_.78)] transition-[color,border-color,transform,box-shadow] duration-[.2s,.2s,.2s,.2s] ease-[ease,ease,ease,ease] [&_svg]:w-[15px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] hover:text-[#0876ef] hover:border-[#a9cff6] hover:shadow-[0_9px_22px_rgba(28,_106,_183,_.1)] hover:transform-[translateY(-2px)] [&:hover_svg]:transform-[translateX(-3px)] max-[640px]:min-h-[38px] max-[640px]:px-[12px] max-[640px]:text-[11px]`} to="/">
              <Icon name="arrow-left" /> Trang chủ
            </Link>
          </div>
        </div>
      </header>

      <div className={`relative z-[2] flex-1 grid grid-cols-[minmax(0,_1.22fr)_minmax(440px,_.78fr)] items-center gap-[clamp(48px,_5vw,_82px)] w-[min(1380px,_calc(100%_-_48px))] mx-auto p-[clamp(28px,_4vh,_48px)_0] max-[1080px]:grid-cols-[minmax(0,_1fr)_minmax(410px,_.9fr)] max-[1080px]:gap-[46px] max-[900px]:w-[min(720px,_calc(100%_-_40px))] max-[900px]:grid-cols-[1fr] max-[900px]:gap-[0] max-[900px]:py-[38px_48px] max-[640px]:w-[calc(100%_-_28px)] max-[640px]:gap-[32px] max-[640px]:py-[25px_38px]`}>
        <AuthStoryAside slide={slide} onSelectSlide={setSlide} />

        <main className={`relative block min-h-0 min-w-0 px-3 py-[26px] bg-transparent before:hidden max-[900px]:w-[min(100%,_600px)] max-[900px]:mx-auto max-[900px]:p-[18px_12px] max-[640px]:p-[12px_2px]`}>
          <div className={`absolute inset-[12px_-2px_56px_28px] border-[length:2px] border-solid border-[rgba(56,_135,_224,_.2)] rounded-[42px_15px_50px_20px] transform-[rotate(2.4deg)] before:content-[''] before:absolute before:right-[-20px] before:top-[70px] before:w-[76px] before:h-[76px] before:rounded-[26px_10px_26px_10px] before:bg-[linear-gradient(145deg,_#7be1ff,_#5c74ed)] before:opacity-[.22] before:transform-[rotate(18deg)] max-[640px]:inset-[6px_0_48px_14px]`} aria-hidden="true" />
          <section className={`relative w-full min-w-0 m-[auto] z-[2] max-w-[500px] p-[clamp(34px,_4vw,_48px)] border border-[rgba(205,_222,_240,_.9)] rounded-[46px_16px_46px_16px] bg-[rgba(255,_255,_255,_.9)] shadow-[0_30px_80px_rgba(28,_76,_128,_.14),_inset_0_1px_0_#fff] backdrop-blur-[18px] before:content-[''] before:absolute before:inset-[0_auto_auto_0] before:w-[86px] before:h-[7px] before:rounded-[46px_0_99px_0] before:bg-[linear-gradient(90deg,_#1683ff,_#5edcff)] max-[900px]:max-w-[560px] max-[640px]:p-[32px_24px] max-[640px]:rounded-[34px_12px_34px_12px]`}>
            <div className={`flex items-center gap-[8px] mb-[24px] text-[#64809d] text-[10px] font-extrabold tracking-[1.35px] uppercase [&_span]:w-[8px] [&_span]:h-[8px] [&_span]:rounded-full [&_span]:bg-[#1abf8d] [&_span]:shadow-[0_0_0_5px_rgba(26,_191,_141,_.12)] max-[640px]:mb-[20px] max-[640px]:text-[9px]`}>
              <span /> Cổng sinh viên trực tuyến
            </div>
            {view === 'login' && sessionEndReason && (
              <div className={`flex items-center gap-[10px] mb-[20px] p-[13px_14px] border border-solid rounded-[16px_7px_16px_7px] text-[13px] leading-[1.5] [&_svg]:flex-[0_0_18px] [&_svg]:w-[18px] [&_svg]:h-[18px] text-[#185f9b] border-[#b9ddfa] bg-[#eef8ff]`} role="status">
                <Icon name="shield" />
                <span>{sessionEndReason === 'inactive'
                  ? 'Phiên đăng nhập đã kết thúc do không hoạt động. Vui lòng đăng nhập lại.'
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
          <p className={`relative z-[3] flex items-center justify-center gap-[8px] m-[22px_auto_0] text-[#6d8195] text-[11.5px] [&_svg]:w-[15px] [&_svg]:text-[#3081d7] max-[640px]:px-[18px] max-[640px]:text-center max-[640px]:leading-[1.5]`}>
            <Icon name="lock" /> Thông tin của bạn được mã hóa và bảo vệ an toàn.
          </p>
        </main>
      </div>

      <SiteFooter className='relative z-[10] flex-none' />

      <OtpModal
        isOpen={otpOpen}
        email={otpEmail}
        onClose={closeOtp}
        onVerify={verifyOtp}
        onResendOtp={resendOtp}
      />
    </div>
  );
}

export default AuthPage;
