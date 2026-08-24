import { useState } from 'react';
import { Icon } from '../common/BrandLogo';
import { ButtonSpinner } from '../common/LoadingSpinner';

interface ResetPasswordFormProps {
  email: string;
  onResetPassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  onBackToLogin: () => void;
}

export function ResetPasswordForm({
  email,
  onResetPassword,
  onBackToLogin,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const strength = Number(password.length >= 8) + Number(/[A-Za-z]/.test(password)) + Number(/\d/.test(password));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ và số.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận chưa trùng khớp.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await onResetPassword(password);
      if (!result.success) setError(result.message);
    } catch {
      setError('Không thể thay đổi mật khẩu lúc này. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={`mb-[26px] [&_h1]:m-[0_0_8px] [&_h1]:font-['Be_Vietnam_Pro'] [&_h1]:text-[30px] [&_h1]:tracking-[-1.2px] [&_p]:m-0 [&_p]:text-[#738097] [&_p]:text-[10.5px] [&_p]:leading-[1.7] max-[580px]:[&_h1]:text-[27px] mb-[30px] [&_h1]:m-[0_0_10px] [&_h1]:text-[#102c4c] [&_h1]:font-['Be_Vietnam_Pro',_sans-serif] [&_h1]:text-[clamp(30px,_3vw,_38px)] [&_h1]:leading-[1.15] [&_h1]:tracking-[-1.35px] [&_p]:max-w-[420px] [&_p]:text-[#647891] [&_p]:text-[14px] max-[640px]:mb-[25px] max-[640px]:[&_h1]:text-[29px] max-[640px]:[&_p]:text-[13px]`}>
        <span className={`grid place-items-center w-[44px] h-[44px] mb-[20px] rounded-[13px] text-white bg-[linear-gradient(135deg,#5b94f6,#2463e1)] shadow-[0_10px_24px_rgba(36,99,225,.24)] [&_svg]:w-[20px] w-[54px] h-[54px] mb-[22px] rounded-[18px_7px_18px_7px] text-white bg-[linear-gradient(145deg,_#55c8ff,_#2365e6_74%)] shadow-[0_14px_28px_rgba(35,_101,_230,_.25)] transform-[rotate(-3deg)] [&_svg]:w-[23px] [&_svg]:transform-[rotate(3deg)] max-[640px]:w-[49px] max-[640px]:h-[49px] max-[640px]:mb-[18px]`}><Icon name="key" /></span>
        <h1>Tạo mật khẩu mới</h1>
        <p>OTP đã được xác minh cho <strong>{email}</strong>. Bây giờ bạn có thể đặt mật khẩu mới.</p>
      </div>
      <div className={`flex items-center gap-[10px] mb-[20px] p-[13px_14px] border border-solid rounded-[16px_7px_16px_7px] text-[13px] leading-[1.5] [&_svg]:flex-[0_0_18px] [&_svg]:w-[18px] [&_svg]:h-[18px] text-[#18795d] border-[#bde9dc] bg-[#effaf6]`}>
        <Icon name="check" /><span>Xác minh Outlook thành công.</span>
      </div>
      {error && (
        <div className={`flex items-center gap-[10px] mb-[20px] p-[13px_14px] border border-solid rounded-[16px_7px_16px_7px] text-[13px] leading-[1.5] [&_svg]:flex-[0_0_18px] [&_svg]:w-[18px] [&_svg]:h-[18px] text-[#b83b4a] border-[#f3cbd0] bg-[#fff3f4]`}>
          <Icon name="shield" /><span>{error}</span>
        </div>
      )}
      <form className={`grid min-w-0 gap-[16px] gap-[19px]`} onSubmit={submit}>
        <div className={`field grid min-w-0 gap-[9px] [&_label]:text-[#304861] [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:tracking-[.55px] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-[56px] [&_input]:p-[0_48px_0_48px] [&_input]:text-[#172f49] [&_input]:border [&_input]:border-[#cfdeec] [&_input]:rounded-[17px_7px_17px_7px] [&_input]:outline-none [&_input]:bg-[#fbfdff] [&_input]:text-[14px] [&_input]:transition-[border-color,box-shadow,background,transform] [&_input]:duration-[.2s,.2s,.2s,.2s] [&_input]:ease-[ease,ease,ease,ease] [&_input::placeholder]:text-[#91a1b3] [&_input::placeholder]:text-[13px] [&_input:hover]:border-[#abc8e5] [&_input:hover]:bg-white [&_input:focus]:border-[#318df1] [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_4px_rgba(49,_141,_241,_.12),_0_10px_24px_rgba(42,_119,_196,_.08)] [&_input:focus]:-translate-y-[1px] max-[640px]:[&_input]:h-[54px] max-[640px]:[&_input]:text-[13.5px]`}>
          <label htmlFor="reset-password">MẬT KHẨU MỚI</label>
          <div className={`relative flex items-center min-w-0`}>
            <Icon name="lock" className={`absolute left-[17px] top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-[#8298af] pointer-events-none z-[2]`} />
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
              autoComplete="new-password"
              required
            />
            <button
              className={`absolute right-[11px] top-1/2 -translate-y-1/2 grid place-items-center w-[36px] h-[36px] p-0 border-0 rounded-[11px_5px_11px_5px] text-[#8290a5] bg-transparent cursor-pointer hover:text-[var(--blue)] hover:bg-[#f0f5ff] [&_svg]:w-[18px] [&_svg]:h-[18px] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px]`}
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} />
            </button>
          </div>
          <div className={`flex gap-[6px] mt-[3px] [&_i]:h-[5px] [&_i]:flex-1 [&_i]:rounded-[5px] [&_i]:bg-[#e6eaf0] [&_i.is-active]:bg-[#4c83e8]`}>
            {[1, 2, 3].map((value) => <i key={value} className={strength >= value ? 'is-active' : ''} />)}
          </div>
          <small className={`text-[#788a9e] text-[11px] leading-[1.5]`}>Sử dụng ít nhất 8 ký tự, bao gồm chữ và số.</small>
        </div>
        <div className={`field grid min-w-0 gap-[9px] [&_label]:text-[#304861] [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:tracking-[.55px] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-[56px] [&_input]:p-[0_48px_0_48px] [&_input]:text-[#172f49] [&_input]:border [&_input]:border-[#cfdeec] [&_input]:rounded-[17px_7px_17px_7px] [&_input]:outline-none [&_input]:bg-[#fbfdff] [&_input]:text-[14px] [&_input]:transition-[border-color,box-shadow,background,transform] [&_input]:duration-[.2s,.2s,.2s,.2s] [&_input]:ease-[ease,ease,ease,ease] [&_input::placeholder]:text-[#91a1b3] [&_input::placeholder]:text-[13px] [&_input:hover]:border-[#abc8e5] [&_input:hover]:bg-white [&_input:focus]:border-[#318df1] [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_4px_rgba(49,_141,_241,_.12),_0_10px_24px_rgba(42,_119,_196,_.08)] [&_input:focus]:-translate-y-[1px] max-[640px]:[&_input]:h-[54px] max-[640px]:[&_input]:text-[13.5px]`}>
          <label htmlFor="reset-confirm">XÁC NHẬN MẬT KHẨU</label>
          <div className={`relative flex items-center min-w-0`}>
            <Icon name="key" className={`absolute left-[17px] top-1/2 -translate-y-1/2 w-[19px] h-[19px] text-[#8298af] pointer-events-none z-[2]`} />
            <input
              id="reset-confirm"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        <button className={`auth-submit relative isolate overflow-hidden w-full h-[55px] border-0 rounded-[18px_7px_18px_7px] text-white bg-[linear-gradient(110deg,_#43a2e8,_#5f91df_58%,_#7a82db)] shadow-[0_14px_30px_rgba(67,_132,_210,_.24),_inset_0_1px_0_rgba(255,255,255,.3)] text-[14px] font-extrabold tracking-[.1px] cursor-pointer transition-[transform,box-shadow,filter] duration-[.25s,.25s,.25s] ease-[ease,ease,ease] disabled:opacity-[.62] disabled:cursor-not-allowed after:content-[''] after:absolute after:z-[-1] after:top-[-80%] after:left-[-55%] after:w-[34%] after:h-[260%] after:pointer-events-none after:bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,.42),_transparent)] after:transform-[rotate(18deg)] after:transition-[left] after:duration-[.72s] after:ease-[cubic-bezier(.2,.8,.2,1)] [&:hover:not(:disabled)]:transform-[translateY(-3px)] [&:hover:not(:disabled)]:filter-[saturate(1.06)_brightness(1.035)] [&:hover:not(:disabled)]:shadow-[0_20px_38px_rgba(67,_132,_210,_.32),_inset_0_1px_0_rgba(255,255,255,.38)] [&:hover:not(:disabled)::after]:left-[125%] [&:active:not(:disabled)]:transform-[translateY(-1px)_scale(.995)] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px] max-[640px]:h-[54px] max-[640px]:text-[13.5px]`} type="submit" disabled={loading}>
          {loading
            ? <ButtonSpinner label="Đang cập nhật mật khẩu..." />
            : 'Cập nhật mật khẩu'}
        </button>
      </form>
      <button className={`inline-flex items-center gap-[6px] mt-[22px] text-[#68758b] border-0 bg-none text-[9px] font-bold cursor-pointer [&_svg]:w-[13px] hover:text-[var(--blue)] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px] gap-[8px] mt-[25px] text-[13px] [&_svg]:w-[16px]`} type="button" onClick={onBackToLogin}>
        <Icon name="arrow-left" /> Quay lại đăng nhập
      </button>
    </div>
  );
}
