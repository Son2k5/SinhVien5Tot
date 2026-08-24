import { useState } from 'react';
import type { AuthView, LoginPayload } from '../../types/auth';
import { authService } from '../../services/authService';
import { Icon } from '../common/BrandLogo';
import { ButtonSpinner } from '../common/LoadingSpinner';

interface LoginFormProps {
  onLogin: (payload: LoginPayload) => Promise<{ success: boolean; message: string }>;
  onSwitchView: (view: AuthView) => void;
}

export function LoginForm({ onLogin, onSwitchView }: LoginFormProps) {
  const [email, setEmail] = useState(() => authService.getSavedEmail());
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return setError('Vui lòng nhập đầy đủ email và mật khẩu.');
    setLoading(true); setError('');
    try {
      const result = await onLogin({ email: email.trim(), password, rememberMe });
      if (!result.success) setError(result.message);
    } catch { setError('Không thể đăng nhập lúc này. Vui lòng thử lại sau.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className={`mb-[26px] [&_h1]:m-[0_0_8px] [&_h1]:font-['Be_Vietnam_Pro'] [&_h1]:text-[30px] [&_h1]:tracking-[-1.2px] [&_p]:m-0 [&_p]:text-[#738097] [&_p]:text-[10.5px] [&_p]:leading-[1.7] max-[580px]:[&_h1]:text-[27px] mb-[30px] [&_h1]:m-[0_0_10px] [&_h1]:text-[#102c4c] [&_h1]:font-['Be_Vietnam_Pro',_sans-serif] [&_h1]:text-[clamp(30px,_3vw,_38px)] [&_h1]:leading-[1.15] [&_h1]:tracking-[-1.35px] [&_p]:max-w-[420px] [&_p]:text-[#647891] [&_p]:text-[14px] max-[640px]:mb-[25px] max-[640px]:[&_h1]:text-[29px] max-[640px]:[&_p]:text-[13px]`}>
        <h1>Chào mừng trở lại</h1>
        <p>Đăng nhập để tiếp tục hành trình chinh phục danh hiệu Sinh viên 5 Tốt.</p>
      </div>
      {error && <div className={`flex items-center gap-[10px] mb-[20px] p-[13px_14px] border border-solid rounded-[16px_7px_16px_7px] text-[13px] leading-[1.5] [&_svg]:flex-[0_0_18px] [&_svg]:w-[18px] [&_svg]:h-[18px] text-[#b83b4a] border-[#f3cbd0] bg-[#fff3f4]`}><Icon name="shield" /><span>{error}</span></div>}
      <form className={`grid min-w-0 gap-[16px] gap-[19px]`} onSubmit={submit}>
        <div className={`field grid min-w-0 gap-[9px] [&_label]:text-[#304861] [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:tracking-[.55px] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-[56px] [&_input]:p-[0_48px_0_48px] [&_input]:text-[#172f49] [&_input]:border [&_input]:border-[#cfdeec] [&_input]:rounded-[17px_7px_17px_7px] [&_input]:outline-none [&_input]:bg-[#fbfdff] [&_input]:text-[14px] [&_input]:transition-[border-color,box-shadow,background,transform] [&_input]:duration-[.2s,.2s,.2s,.2s] [&_input]:ease-[ease,ease,ease,ease] [&_input::placeholder]:text-[#91a1b3] [&_input::placeholder]:text-[13px] [&_input:hover]:border-[#abc8e5] [&_input:hover]:bg-white [&_input:focus]:border-[#318df1] [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_4px_rgba(49,_141,_241,_.12),_0_10px_24px_rgba(42,_119,_196,_.08)] [&_input:focus]:transform-[translateY(-1px)] max-[640px]:[&_input]:h-[54px] max-[640px]:[&_input]:text-[13.5px]`}>
          <label htmlFor="login-email">EMAIL SINH VIÊN</label>
          <div className={`relative flex items-center min-w-0`}>
            <Icon name="mail" className={`absolute left-[17px] top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-[#8298af] pointer-events-none z-[2]`} />
            <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="2301140097@ms.hanu.edu.vn" autoComplete="email" required />
          </div>
        </div>
        <div className={`field grid min-w-0 gap-[9px] [&_label]:text-[#304861] [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:tracking-[.55px] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-[56px] [&_input]:p-[0_48px_0_48px] [&_input]:text-[#172f49] [&_input]:border [&_input]:border-[#cfdeec] [&_input]:rounded-[17px_7px_17px_7px] [&_input]:outline-none [&_input]:bg-[#fbfdff] [&_input]:text-[14px] [&_input]:transition-[border-color,box-shadow,background,transform] [&_input]:duration-[.2s,.2s,.2s,.2s] [&_input]:ease-[ease,ease,ease,ease] [&_input::placeholder]:text-[#91a1b3] [&_input::placeholder]:text-[13px] [&_input:hover]:border-[#abc8e5] [&_input:hover]:bg-white [&_input:focus]:border-[#318df1] [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_4px_rgba(49,_141,_241,_.12),_0_10px_24px_rgba(42,_119,_196,_.08)] [&_input:focus]:-translate-y-[1px] max-[640px]:[&_input]:h-[54px] max-[640px]:[&_input]:text-[13.5px]`}>
          <label htmlFor="login-password">MẬT KHẨU</label>
          <div className={`relative flex items-center min-w-0`}>
            <Icon name="lock" className={`absolute left-[17px] top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-[#8298af] pointer-events-none z-[2]`} />
            <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password" required />
            <button className={`absolute right-[11px] top-1/2 -translate-y-1/2 grid place-items-center w-[36px] h-[36px] p-0 border-0 rounded-[11px_5px_11px_5px] text-[#8290a5] bg-transparent cursor-pointer hover:text-[var(--blue)] hover:bg-[#f0f5ff] [&_svg]:w-[18px] [&_svg]:h-[18px] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px]`} type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
              <Icon name={showPassword ? 'eye-off' : 'eye'} />
            </button>
          </div>
        </div>
        <div className={`flex justify-between items-center text-[12.5px] max-[640px]:items-start max-[640px]:gap-[14px] max-[640px]:text-[11.5px]`}>
          <label className={`flex items-center gap-[9px] text-[#5c7087] cursor-pointer [&_input]:w-[17px] [&_input]:h-[17px] [&_input]:accent-[var(--blue)]`}><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Ghi nhớ đăng nhập</label>
          <button className={`text-[var(--blue)] border-0 bg-none text-[12.5px] font-extrabold cursor-pointer hover:underline focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px] max-[640px]:text-[11.5px]`} type="button" onClick={() => onSwitchView('forgot-password')}>Quên mật khẩu?</button>
        </div>
        <button className={`auth-submit relative isolate overflow-hidden w-full h-[55px] border-0 rounded-[18px_7px_18px_7px] text-white bg-[linear-gradient(110deg,_#43a2e8,_#5f91df_58%,_#7a82db)] shadow-[0_14px_30px_rgba(67,_132,_210,_.24),_inset_0_1px_0_rgba(255,255,255,.3)] text-[14px] font-extrabold tracking-[.1px] cursor-pointer transition-[transform,box-shadow,filter] duration-[.25s,.25s,.25s] ease-[ease,ease,ease] disabled:opacity-[.62] disabled:cursor-not-allowed after:content-[''] after:absolute after:z-[-1] after:top-[-80%] after:left-[-55%] after:w-[34%] after:h-[260%] after:pointer-events-none after:bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,.42),_transparent)] after:transform-[rotate(18deg)] after:transition-[left] after:duration-[.72s] after:ease-[cubic-bezier(.2,.8,.2,1)] [&:hover:not(:disabled)]:transform-[translateY(-3px)] [&:hover:not(:disabled)]:filter-[saturate(1.06)_brightness(1.035)] [&:hover:not(:disabled)]:shadow-[0_20px_38px_rgba(67,_132,_210,_.32),_inset_0_1px_0_rgba(255,255,255,.38)] [&:hover:not(:disabled)::after]:left-[125%] [&:active:not(:disabled)]:transform-[translateY(-1px)_scale(.995)] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px] max-[640px]:h-[54px] max-[640px]:text-[13.5px]`} type="submit" disabled={loading}>{loading ? <ButtonSpinner label="Đang đăng nhập..." /> : 'Đăng nhập'}</button>
      </form>
      <p className={`m-[24px_0_0] text-[#7b879b] text-center text-[9.5px] [&_button]:ml-[4px] [&_button]:text-[var(--blue)] [&_button]:border-0 [&_button]:bg-none [&_button]:text-inherit [&_button]:font-extrabold [&_button]:cursor-pointer [&_button:focus-visible]:outline-[length:3px] [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-[color:rgba(22,_131,_255,_.28)] [&_button:focus-visible]:outline-offset-[3px] m-[26px_0_0] text-[#697c92] text-[13px] max-[640px]:text-[12px]`}>Chưa có tài khoản?<button type="button" onClick={() => onSwitchView('register')}>Đăng ký miễn phí</button></p>
    </div>
  );
}
