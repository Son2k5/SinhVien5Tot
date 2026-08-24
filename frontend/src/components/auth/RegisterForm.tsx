import { useState } from 'react';
import type { AuthView, RegisterPayload } from '../../types/auth';
import { Icon } from '../common/BrandLogo';
import { ButtonSpinner } from '../common/LoadingSpinner';

interface RegisterFormProps {
  onRegister: (payload: RegisterPayload) => Promise<{ success: boolean; message: string }>;
  onSwitchView: (view: AuthView) => void;
}

export function RegisterForm({ onRegister, onSwitchView }: RegisterFormProps) {
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const strength = Number(password.length >= 8) + Number(/[A-Za-z]/.test(password)) + Number(/\d/.test(password));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirm) return setError('Vui lòng điền đầy đủ thông tin đăng ký.');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return setError('Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số.');
    if (password !== confirm) return setError('Mật khẩu xác nhận chưa trùng khớp.');
    setLoading(true); setError('');
    try { const result = await onRegister({ name: name.trim(), email: email.trim(), password }); if (!result.success) setError(result.message); }
    catch { setError('Không thể tạo tài khoản lúc này. Vui lòng thử lại sau.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className={`mb-[26px] [&_h1]:m-[0_0_8px] [&_h1]:font-['Be_Vietnam_Pro'] [&_h1]:text-[30px] [&_h1]:tracking-[-1.2px] [&_p]:m-0 [&_p]:text-[#738097] [&_p]:text-[10.5px] [&_p]:leading-[1.7] max-[580px]:[&_h1]:text-[27px] mb-[30px] [&_h1]:m-[0_0_10px] [&_h1]:text-[#102c4c] [&_h1]:font-['Be_Vietnam_Pro',_sans-serif] [&_h1]:text-[clamp(30px,_3vw,_38px)] [&_h1]:leading-[1.15] [&_h1]:tracking-[-1.35px] [&_p]:max-w-[420px] [&_p]:text-[#647891] [&_p]:text-[14px] max-[640px]:mb-[25px] max-[640px]:[&_h1]:text-[29px] max-[640px]:[&_p]:text-[13px]`}><h1>Tạo tài khoản mới</h1><p>Bắt đầu xây dựng hồ sơ và ghi dấu từng bước trưởng thành của bạn.</p></div>
      {error && <div className={`flex items-center gap-[10px] mb-[20px] p-[13px_14px] border border-solid rounded-[16px_7px_16px_7px] text-[13px] leading-[1.5] [&_svg]:flex-[0_0_18px] [&_svg]:w-[18px] [&_svg]:h-[18px] text-[#b83b4a] border-[#f3cbd0] bg-[#fff3f4]`}><Icon name="shield" /><span>{error}</span></div>}
      <form className={`grid min-w-0 gap-[16px] gap-[19px]`} onSubmit={submit}>
        <div className={`field grid min-w-0 gap-[9px] [&_label]:text-[#304861] [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:tracking-[.55px] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-[56px] [&_input]:p-[0_48px_0_48px] [&_input]:text-[#172f49] [&_input]:border [&_input]:border-[#cfdeec] [&_input]:rounded-[17px_7px_17px_7px] [&_input]:outline-none [&_input]:bg-[#fbfdff] [&_input]:text-[14px] [&_input]:transition-[border-color,box-shadow,background,transform] [&_input]:duration-[.2s,.2s,.2s,.2s] [&_input]:ease-[ease,ease,ease,ease] [&_input::placeholder]:text-[#91a1b3] [&_input::placeholder]:text-[13px] [&_input:hover]:border-[#abc8e5] [&_input:hover]:bg-white [&_input:focus]:border-[#318df1] [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_4px_rgba(49,_141,_241,_.12),_0_10px_24px_rgba(42,_119,_196,_.08)] [&_input:focus]:-translate-y-[1px] max-[640px]:[&_input]:h-[54px] max-[640px]:[&_input]:text-[13.5px]`}>
          <label htmlFor="register-name">HỌ VÀ TÊN</label>
          <div className={`relative flex items-center min-w-0`}>
            <Icon name="user" className={`absolute left-[17px] top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-[#8298af] pointer-events-none z-[2]`} />
            <input id="register-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Minh Anh" autoComplete="name" required />
          </div>
        </div>
        <div className={`field grid min-w-0 gap-[9px] [&_label]:text-[#304861] [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:tracking-[.55px] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-[56px] [&_input]:p-[0_48px_0_48px] [&_input]:text-[#172f49] [&_input]:border [&_input]:border-[#cfdeec] [&_input]:rounded-[17px_7px_17px_7px] [&_input]:outline-none [&_input]:bg-[#fbfdff] [&_input]:text-[14px] [&_input]:transition-[border-color,box-shadow,background,transform] [&_input]:duration-[.2s,.2s,.2s,.2s] [&_input]:ease-[ease,ease,ease,ease] [&_input::placeholder]:text-[#91a1b3] [&_input::placeholder]:text-[13px] [&_input:hover]:border-[#abc8e5] [&_input:hover]:bg-white [&_input:focus]:border-[#318df1] [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_4px_rgba(49,_141,_241,_.12),_0_10px_24px_rgba(42,_119,_196,_.08)] [&_input:focus]:-translate-y-[1px] max-[640px]:[&_input]:h-[54px] max-[640px]:[&_input]:text-[13.5px]`}>
          <label htmlFor="register-email">EMAIL SINH VIÊN</label>
          <div className={`relative flex items-center min-w-0`}>
            <Icon name="mail" className={`absolute left-[17px] top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-[#8298af] pointer-events-none z-[2]`} />
            <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="2301140097@ms.hanu.edu.vn" autoComplete="email" required />
          </div>
        </div>
        <div className={`field grid min-w-0 gap-[9px] [&_label]:text-[#304861] [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:tracking-[.55px] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-[56px] [&_input]:p-[0_48px_0_48px] [&_input]:text-[#172f49] [&_input]:border [&_input]:border-[#cfdeec] [&_input]:rounded-[17px_7px_17px_7px] [&_input]:outline-none [&_input]:bg-[#fbfdff] [&_input]:text-[14px] [&_input]:transition-[border-color,box-shadow,background,transform] [&_input]:duration-[.2s,.2s,.2s,.2s] [&_input]:ease-[ease,ease,ease,ease] [&_input::placeholder]:text-[#91a1b3] [&_input::placeholder]:text-[13px] [&_input:hover]:border-[#abc8e5] [&_input:hover]:bg-white [&_input:focus]:border-[#318df1] [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_4px_rgba(49,_141,_241,_.12),_0_10px_24px_rgba(42,_119,_196,_.08)] [&_input:focus]:-translate-y-[1px] max-[640px]:[&_input]:h-[54px] max-[640px]:[&_input]:text-[13.5px]`}>
          <label htmlFor="register-password">MẬT KHẨU</label>
          <div className={`relative flex items-center min-w-0`}>
            <Icon name="lock" className={`absolute left-[17px] top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-[#8298af] pointer-events-none z-[2]`} />
            <input id="register-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" required />
            <button className={`absolute right-[11px] top-1/2 -translate-y-1/2 grid place-items-center w-[36px] h-[36px] p-0 border-0 rounded-[11px_5px_11px_5px] text-[#8290a5] bg-transparent cursor-pointer hover:text-[var(--blue)] hover:bg-[#f0f5ff] [&_svg]:w-[18px] [&_svg]:h-[18px] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px]`} type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện hoặc ẩn mật khẩu">
              <Icon name={showPassword ? 'eye-off' : 'eye'} />
            </button>
          </div>
          <div className={`flex gap-[6px] mt-[3px] [&_i]:h-[5px] [&_i]:flex-1 [&_i]:rounded-[5px] [&_i]:bg-[#e6eaf0] [&_i.is-active]:bg-[#4c83e8]`}>{[1,2,3].map((value) => <i key={value} className={strength >= value ? 'is-active' : ''} />)}</div>
          <small className={`text-[#788a9e] text-[11px] leading-[1.5]`}>Sử dụng ít nhất 8 ký tự, bao gồm chữ và số.</small>
        </div>
        <div className={`field grid min-w-0 gap-[9px] [&_label]:text-[#304861] [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:tracking-[.55px] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-[56px] [&_input]:p-[0_48px_0_48px] [&_input]:text-[#172f49] [&_input]:border [&_input]:border-[#cfdeec] [&_input]:rounded-[17px_7px_17px_7px] [&_input]:outline-none [&_input]:bg-[#fbfdff] [&_input]:text-[14px] [&_input]:transition-[border-color,box-shadow,background,transform] [&_input]:duration-[.2s,.2s,.2s,.2s] [&_input]:ease-[ease,ease,ease,ease] [&_input::placeholder]:text-[#91a1b3] [&_input::placeholder]:text-[13px] [&_input:hover]:border-[#abc8e5] [&_input:hover]:bg-white [&_input:focus]:border-[#318df1] [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_4px_rgba(49,_141,_241,_.12),_0_10px_24px_rgba(42,_119,_196,_.08)] [&_input:focus]:-translate-y-[1px] max-[640px]:[&_input]:h-[54px] max-[640px]:[&_input]:text-[13.5px]`}>
          <label htmlFor="register-confirm">XÁC NHẬN MẬT KHẨU</label>
          <div className={`relative flex items-center min-w-0`}>
            <Icon name="key" className={`absolute left-[17px] top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-[#8298af] pointer-events-none z-[2]`} />
            <input id="register-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" required />
          </div>
        </div>
        <button className={`auth-submit relative isolate overflow-hidden w-full h-[55px] border-0 rounded-[18px_7px_18px_7px] text-white bg-[linear-gradient(110deg,_#43a2e8,_#5f91df_58%,_#7a82db)] shadow-[0_14px_30px_rgba(67,_132,_210,_.24),_inset_0_1px_0_rgba(255,255,255,.3)] text-[14px] font-extrabold tracking-[.1px] cursor-pointer transition-[transform,box-shadow,filter] duration-[.25s,.25s,.25s] ease-[ease,ease,ease] disabled:opacity-[.62] disabled:cursor-not-allowed after:content-[''] after:absolute after:z-[-1] after:top-[-80%] after:left-[-55%] after:w-[34%] after:h-[260%] after:pointer-events-none after:bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,.42),_transparent)] after:transform-[rotate(18deg)] after:transition-[left] after:duration-[.72s] after:ease-[cubic-bezier(.2,.8,.2,1)] [&:hover:not(:disabled)]:transform-[translateY(-3px)] [&:hover:not(:disabled)]:filter-[saturate(1.06)_brightness(1.035)] [&:hover:not(:disabled)]:shadow-[0_20px_38px_rgba(67,_132,_210,_.32),_inset_0_1px_0_rgba(255,255,255,.38)] [&:hover:not(:disabled)::after]:left-[125%] [&:active:not(:disabled)]:transform-[translateY(-1px)_scale(.995)] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px] max-[640px]:h-[54px] max-[640px]:text-[13.5px]`} type="submit" disabled={loading}>{loading ? <ButtonSpinner label="Đang tạo tài khoản..." /> : 'Đăng ký và nhận mã OTP'}</button>
      </form>
      <p className={`m-[24px_0_0] text-[#7b879b] text-center text-[9.5px] [&_button]:ml-[4px] [&_button]:text-[var(--blue)] [&_button]:border-0 [&_button]:bg-none [&_button]:text-inherit [&_button]:font-extrabold [&_button]:cursor-pointer [&_button:focus-visible]:outline-[length:3px] [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-[color:rgba(22,_131,_255,_.28)] [&_button:focus-visible]:outline-offset-[3px] m-[26px_0_0] text-[#697c92] text-[13px] max-[640px]:text-[12px]`}>Đã có tài khoản?<button type="button" onClick={() => onSwitchView('login')}>Đăng nhập ngay</button></p>
    </div>
  );
}
