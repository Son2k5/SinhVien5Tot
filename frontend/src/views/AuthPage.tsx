import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { AuthView, User } from '../types/auth';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { OtpModal } from '../components/auth/OtpModal';
import { BrandLogo, Icon } from '../components/common/BrandLogo';
import { SiteFooter } from '../components/common/SiteFooter';
import { useAuthHandlers } from '../hooks/auth/useAuthHandlers';
import { useSlideshow } from '../hooks/auth/useSlideshow';

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
  const { slide, setSlide } = useSlideshow(slides.length);
  const sessionEndReason = searchParams.get('reason');

  const {
    otpOpen,
    otpEmail,
    purpose,
    verifiedResetOtp,
    closeOtp,
    handleLogin,
    handleRegister,
    handleForgot,
    verifyOtp,
    resendOtp,
    handleResetPassword,
  } = useAuthHandlers(onLoginSuccess as Parameters<typeof useAuthHandlers>[0]);

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
        <aside className={`auth-story relative min-w-0 min-h-[clamp(560px,_calc(100dvh_-_240px),_720px)] overflow-hidden text-white border-[length:8px] border-solid border-[rgba(255,_255,_255,_.88)] rounded-[54px_150px_70px_118px_/_88px_64px_142px_76px] bg-[#123c77] shadow-[0_34px_76px_rgba(15,_77,_139,_.24),_0_12px_28px_rgba(15,_77,_139,_.12)] transform-[rotate(-.65deg)] before:content-[''] before:absolute before:z-[5] before:inset-[14px] before:pointer-events-none before:border before:border-[rgba(255,_255,_255,_.24)] before:rounded-[44px_132px_58px_104px_/_70px_54px_126px_64px] [&_.auth-slider-dots]:relative [&_.auth-slider-dots]:z-[8] [&_.auth-slider-dots]:flex [&_.auth-slider-dots]:gap-[8px] [&_.auth-slider-dots]:mt-[30px] [&_.auth-slider-dots_button]:w-[9px] [&_.auth-slider-dots_button]:h-[9px] [&_.auth-slider-dots_button]:p-0 [&_.auth-slider-dots_button]:border-0 [&_.auth-slider-dots_button]:rounded-full [&_.auth-slider-dots_button]:bg-[rgba(255,255,255,.42)] [&_.auth-slider-dots_button]:cursor-pointer [&_.auth-slider-dots_button]:transition-[width,background] [&_.auth-slider-dots_button]:duration-[.25s,.25s] [&_.auth-slider-dots_button]:ease-[ease,ease] [&_.auth-slider-dots_button.is-active]:w-[34px] [&_.auth-slider-dots_button.is-active]:bg-white max-[1080px]:min-h-[650px] max-[900px]:hidden max-[900px]:min-h-[420px] max-[900px]:rounded-[42px_110px_48px_82px_/_58px_46px_100px_56px] max-[900px]:before:rounded-[32px_92px_38px_68px_/_48px_36px_86px_44px] max-[900px]:[&_.auth-slider-dots]:mt-[22px] max-[640px]:min-h-[325px] max-[640px]:border-[length:6px] max-[640px]:rounded-[32px_76px_38px_58px_/_44px_34px_72px_42px] max-[640px]:before:inset-[10px] max-[640px]:before:rounded-[24px_64px_28px_48px_/_34px_26px_62px_32px] max-[640px]:[&_.auth-slider-dots]:mt-[16px]`} aria-label="Thông tin về hành trình Sinh viên 5 Tốt">
          <div className={`absolute inset-0 z-[2] left-[auto] top-[-90px] right-[-70px] w-[320px] h-[320px] rounded-full bg-[rgba(67,_204,_255,_.28)] filter-[blur(42px)]`} aria-hidden="true" />
          <div className={`absolute z-[4] right-[36px] top-[32px] w-[110px] h-[86px] opacity-[.5] bg-[image:radial-gradient(rgba(255,255,255,.85)_1.6px,_transparent_1.6px)] bg-[length:13px_13px] transform-[rotate(9deg)]`} aria-hidden="true" />
          <div className={`auth-story__media absolute inset-0 [&_img]:absolute [&_img]:inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:transition-[opacity,transform] [&_img]:duration-[.8s,7s] [&_img]:ease-[ease,ease]`} aria-hidden="true">
            {slides.map((item, index) => (
              <img
                key={item.image}
                src={item.image}
                alt=""
                className={index === slide ? 'opacity-100 scale-[1.04]' : 'opacity-0 scale-[1.12]'}
              />
            ))}
          </div>
          <div className={`absolute inset-0 bg-[linear-gradient(180deg,_rgba(3,_24,_58,_.12)_8%,_rgba(5,_33,_76,_.28)_42%,_rgba(5,_25,_59,_.93)_100%),_linear-gradient(115deg,_rgba(8,_69,_143,_.28),_transparent_62%)]`} aria-hidden="true" />
          <div className={`absolute z-[7] inset-[auto_54px_52px] max-w-[530px] transform-[rotate(.65deg)] [&_h2]:m-[18px_0_14px] [&_h2]:font-['Be_Vietnam_Pro',_sans-serif] [&_h2]:text-[clamp(34px,_3.2vw,_48px)] [&_h2]:leading-[1.12] [&_h2]:tracking-[-1.8px] [&_h2]:text-balance [&>p]:max-w-[510px] [&>p]:m-0 [&>p]:text-[rgba(229,_241,_255,_.84)] [&>p]:text-[14px] [&>p]:leading-[1.75] max-[1080px]:inset-x-[40px] max-[1080px]:bottom-[44px] max-[900px]:inset-[auto_42px_36px] max-[900px]:max-w-[560px] max-[900px]:[&_h2]:max-w-[500px] max-[900px]:[&_h2]:text-[34px] max-[900px]:[&>p]:max-w-[500px] max-[640px]:inset-[auto_25px_25px] max-[640px]:[&_h2]:m-[12px_0_8px] max-[640px]:[&_h2]:max-w-[370px] max-[640px]:[&_h2]:text-[27px] max-[640px]:[&_h2]:tracking-[-1px] max-[640px]:[&>p]:text-[12px] max-[640px]:[&>p]:leading-[1.55]`}>
            <span className={`inline-flex items-center min-h-[32px] p-[0_13px] border border-[rgba(255,_255,_255,_.26)] rounded-[999px] bg-[rgba(255,_255,_255,_.13)] shadow-[inset_0_1px_0_rgba(255,255,255,.15)] backdrop-blur-[12px] text-[10px] font-extrabold tracking-[1.4px] max-[640px]:min-h-[27px] max-[640px]:px-[10px] max-[640px]:text-[8px]`}>{slides[slide].badge}</span>
            <h2>{slides[slide].title}</h2>
            <p>{slides[slide].text}</p>
            <div className={`flex flex-wrap gap-[10px_18px] mt-[23px] [&_span]:inline-flex [&_span]:items-center [&_span]:gap-[7px] [&_span]:text-[rgba(241,_248,_255,_.9)] [&_span]:text-[12px] [&_span]:font-semibold [&_svg]:w-[17px] [&_svg]:h-[17px] [&_svg]:p-[3px] [&_svg]:rounded-full [&_svg]:text-[#0b5b47] [&_svg]:bg-[#83efd0] [&_svg]:stroke-[length:3] max-[900px]:mt-[18px] max-[640px]:hidden`}>
              <span><Icon name="check" /> Xác minh qua email HANU</span>
              <span><Icon name="check" /> Theo dõi hành trình tập trung</span>
            </div>
            <div className={`auth-slider-dots relative z-[2] flex gap-[6px] mt-[28px] [&_button]:w-[7px] [&_button]:h-[7px] [&_button]:p-0 [&_button]:border-0 [&_button]:rounded-[9px] [&_button]:bg-[rgba(255,255,255,.35)] [&_button]:cursor-pointer [&_button]:transition-[width,background-color] [&_button]:duration-[.25s] [&_button]:ease-[ease] [&_button.is-active]:w-[28px] [&_button.is-active]:bg-white [&_button:focus-visible]:outline-[length:3px] [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-[color:rgba(22,_131,_255,_.3)] [&_button:focus-visible]:outline-offset-[4px]`}>
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
          <div className={`absolute z-[9] top-[48px] right-[36px] flex items-center gap-[9px] w-[122px] h-[122px] p-[17px] text-[#124475] border-[length:7px] border-solid border-[rgba(255,255,255,.82)] rounded-[44%_56%_50%_50%_/_58%_42%_58%_42%] bg-[linear-gradient(145deg,_#eafffb,_#9fead9)] shadow-[0_18px_34px_rgba(3,_35,_68,_.22)] transform-[rotate(8deg)] [&_strong]:font-['Be_Vietnam_Pro',_sans-serif] [&_strong]:text-[43px] [&_strong]:leading-[1] [&_strong]:tracking-[-3px] [&_span]:text-[8px] [&_span]:font-extrabold [&_span]:leading-[1.45] [&_span]:tracking-[.5px] [&_span]:uppercase max-[1080px]:w-[104px] max-[1080px]:h-[104px] max-[1080px]:right-[28px] max-[1080px]:[&_strong]:text-[36px] max-[900px]:top-[28px] max-[640px]:hidden`} aria-hidden="true">
            <strong>5</strong>
            <span>tiêu chí<br />một hành trình</span>
          </div>
        </aside>

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
        title={purpose === 'register' ? 'Xác minh tài khoản' : 'Nhập OTP từ Outlook'}
      />
    </div>
  );
}
