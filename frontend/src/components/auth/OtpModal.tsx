import { useEffect, useRef, useState } from 'react';
import { ButtonSpinner } from '../common/LoadingSpinner';
import { Icon } from '../common/BrandLogo';

const OTP_SLOT_KEYS = ['otp-slot-0', 'otp-slot-1', 'otp-slot-2', 'otp-slot-3', 'otp-slot-4', 'otp-slot-5'] as const;

interface OtpModalProps {
  email: string; isOpen: boolean; onClose: () => void;
  onVerify: (otp: string) => Promise<{ success: boolean; message: string }>;
  onResendOtp: () => Promise<{ success: boolean; message: string }>;
  title?: string; subtitle?: string;
}

export function OtpModal({ email, isOpen, onClose, onVerify, onResendOtp, title = 'Xác minh mã OTP', subtitle = 'Mã OTP 6 chữ số đã được gửi an toàn đến' }: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(6).fill(''));
  const [loading, setLoading] = useState(false); const [resending, setResending] = useState(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [timer, setTimer] = useState(60);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDigits(Array(6).fill('')); setError(''); setSuccess(''); setTimer(60);
    const focusTimer = window.setTimeout(() => refs.current[0]?.focus(), 100);
    return () => {
      window.clearTimeout(focusTimer);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    const interval = window.setInterval(() => setTimer((value) => value - 1), 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, timer]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const container = dialogRef.current;
    if (!container) return;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const change = (index: number, input: string) => {
    const value = input.replace(/\D/g, ''); if (!value && input) return;
    const next = [...digits];
    if (value.length > 1) value.slice(0, 6).split('').forEach((digit, i) => { next[i] = digit; });
    else next[index] = value;
    setDigits(next); setError('');
    const nextIndex = value.length > 1 ? Math.min(value.length, 5) : index + 1;
    if (value && nextIndex < 6) refs.current[nextIndex]?.focus();
  };
  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); const otp = digits.join(''); if (otp.length !== 6) return setError('Vui lòng nhập đủ 6 chữ số OTP.');
    setLoading(true); setError(''); setSuccess('');
    try {
      const result = await onVerify(otp);
      if (result.success) setSuccess(result.message);
      else setError(result.message);
    }
    catch { setError('Xác minh không thành công. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };
  const resend = async () => {
    setResending(true); setError(''); setSuccess('');
    try { const result = await onResendOtp(); if (result.success) { setSuccess(result.message); setTimer(60); } else setError(result.message); }
    catch { setError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.'); }
    finally { setResending(false); }
  };
  return (
    <div className={`fixed z-[110] inset-0 grid place-items-center p-[20px] bg-[rgba(7,15,34,.65)] backdrop-blur-[8px] bg-[rgba(7,_25,_52,_.68)] backdrop-blur-[12px]`} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section ref={dialogRef} onKeyDown={handleKeyDown} className={`otp-dialog relative w-[min(100%,430px)] p-[30px] border border-[#e0e6f0] rounded-[20px] bg-white shadow-[0_30px_90px_rgba(0,0,0,.28)] text-center [&_h3]:m-[0_0_7px] [&_h3]:font-['Be_Vietnam_Pro'] [&_h3]:text-[19px] [&>p]:m-0 [&>p]:text-[#748096] [&>p]:text-[9.5px] [&>p]:leading-[1.65] [&>p_strong]:text-[var(--blue)] max-[580px]:p-[27px_17px] w-[min(100%,_470px)] p-[38px] rounded-[34px_12px_34px_12px] shadow-[0_34px_100px_rgba(0,0,0,.3)] before:content-[''] before:absolute before:inset-[0_auto_auto_0] before:w-[92px] before:h-[7px] before:rounded-[34px_0_99px] before:bg-[linear-gradient(90deg,_#1683ff,_#6adff5)] [&_h3]:mb-[9px] [&_h3]:text-[25px] [&_h3]:tracking-[-.6px] [&>p]:text-[13px] [&>p]:leading-[1.7] max-[640px]:p-[34px_20px_28px]`} role="dialog" aria-modal="true" aria-labelledby="otp-title">
        <button className={`absolute top-[13px] right-[13px] grid place-items-center w-[32px] h-[32px] border-0 rounded-[9px] text-[#7e8a9e] bg-[#f3f6fa] cursor-pointer [&_svg]:w-[16px] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px] top-[16px] right-[16px] w-[38px] h-[38px] rounded-[13px_6px_13px_6px]`} onClick={onClose} aria-label="Đóng"><Icon name="x" /></button>
        <span className={`grid place-items-center w-[49px] h-[49px] m-[0_auto_15px] rounded-[14px] text-[var(--blue)] bg-[#edf3ff] [&_svg]:w-[22px] w-[58px] h-[58px] mb-[18px] rounded-[20px_8px_20px_8px] [&_svg]:w-[25px]`}><Icon name="lock" /></span>
        <h3 id="otp-title">{title}</h3><p>{subtitle}<br /><strong>{email}</strong></p>
        {error && <div className={`flex items-center gap-[10px] mb-[20px] p-[13px_14px] border border-solid rounded-[16px_7px_16px_7px] text-[13px] leading-[1.5] [&_svg]:flex-[0_0_18px] [&_svg]:w-[18px] [&_svg]:h-[18px] text-[#b83b4a] border-[#f3cbd0] bg-[#fff3f4] mt-[16px]`}><Icon name="shield" /><span>{error}</span></div>}
        {success && <div className={`flex items-center gap-[10px] mb-[20px] p-[13px_14px] border border-solid rounded-[16px_7px_16px_7px] text-[13px] leading-[1.5] [&_svg]:flex-[0_0_18px] [&_svg]:w-[18px] [&_svg]:h-[18px] text-[#18795d] border-[#bde9dc] bg-[#effaf6] mt-[16px]`}><Icon name="check" /><span>{success}</span></div>}
        <form onSubmit={verify}>
          <div className={`flex justify-center gap-[7px] m-[23px_0_18px] [&_input]:w-[45px] [&_input]:h-[52px] [&_input]:border [&_input]:border-[#d6deea] [&_input]:rounded-[11px] [&_input]:text-[#17243c] [&_input]:bg-[#f8faff] [&_input]:text-center [&_input]:text-[18px] [&_input]:font-extrabold [&_input]:outline-none [&_input:focus]:border-[var(--blue)] [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_4px_#edf3ff] max-[580px]:gap-[4px] max-[580px]:[&_input]:w-[40px] max-[580px]:[&_input]:h-[49px] gap-[9px] m-[28px_0_22px] [&_input]:w-[51px] [&_input]:h-[59px] [&_input]:rounded-[15px_7px_15px_7px] [&_input]:text-[21px] max-[640px]:gap-[5px] max-[640px]:[&_input]:w-[clamp(39px,_12vw,_47px)] max-[640px]:[&_input]:h-[55px]`}>{digits.map((digit, index) => <input key={OTP_SLOT_KEYS[index]} ref={(el) => { refs.current[index] = el; }} inputMode="numeric" maxLength={6} value={digit} aria-label={`Chữ số OTP ${index + 1}`} onChange={(e) => change(index, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus(); }} />)}</div>
          <button className={`auth-submit w-full h-[48px] border-0 rounded-[11px] text-white bg-[linear-gradient(135deg,#3a7bed,#2057cf)] shadow-[0_12px_26px_rgba(35,91,211,.22)] text-[10.5px] font-extrabold cursor-pointer transition-[transform,box-shadow,filter] duration-[.2s] ease-[ease] [&:hover:not(:disabled)]:transform-[translateY(-2px)] [&:hover:not(:disabled)]:shadow-[0_16px_30px_rgba(35,91,211,.3)] disabled:opacity-[.62] disabled:cursor-not-allowed relative isolate overflow-hidden h-[55px] rounded-[18px_7px_18px_7px] bg-[linear-gradient(110deg,_#43a2e8,_#5f91df_58%,_#7a82db)] shadow-[0_14px_30px_rgba(67,_132,_210,_.24),_inset_0_1px_0_rgba(255,255,255,.3)] text-[14px] tracking-[.1px] after:content-[''] after:absolute after:z-[-1] after:top-[-80%] after:left-[-55%] after:w-[34%] after:h-[260%] after:pointer-events-none after:bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,.42),_transparent)] after:transform-[rotate(18deg)] after:transition-[left] after:duration-[.72s] after:ease-[cubic-bezier(.2,.8,.2,1)] [&:hover:not(:disabled)]:transform-[translateY(-3px)] [&:hover:not(:disabled)]:filter-[saturate(1.06)_brightness(1.035)] [&:hover:not(:disabled)]:shadow-[0_20px_38px_rgba(67,_132,_210,_.32),_inset_0_1px_0_rgba(255,255,255,.38)] [&:hover:not(:disabled)::after]:left-[125%] [&:active:not(:disabled)]:transform-[translateY(-1px)_scale(.995)] focus-visible:outline-[length:3px] focus-visible:outline-solid focus-visible:outline-[color:rgba(22,_131,_255,_.28)] focus-visible:outline-offset-[3px] max-[640px]:h-[54px] max-[640px]:text-[13.5px]`} type="submit" disabled={loading || digits.join('').length !== 6}>{loading ? <ButtonSpinner label="Đang xác minh..." /> : 'Xác nhận mã OTP'}</button>
        </form>
        <div className={`mt-[16px] text-[#7f8a9d] text-[8.5px] [&_button]:text-[var(--blue)] [&_button]:border-0 [&_button]:bg-none [&_button]:font-extrabold [&_button]:cursor-pointer [&_button:focus-visible]:outline-[length:3px] [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-[color:rgba(22,_131,_255,_.28)] [&_button:focus-visible]:outline-offset-[3px] mt-[20px] text-[12px]`}>Chưa nhận được mã? {timer > 0 ? <span>Gửi lại sau {timer}s</span> : <button type="button" onClick={resend} disabled={resending}>{resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}</button>}</div>
      </section>
    </div>
  );
}
