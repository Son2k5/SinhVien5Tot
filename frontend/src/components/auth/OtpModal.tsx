import { useEffect, useRef, useState } from 'react';
import { ButtonSpinner } from '../common/LoadingSpinner';
import { Icon } from '../common/BrandLogo';

interface OtpModalProps {
  email: string; isOpen: boolean; onClose: () => void;
  onVerify: (otp: string) => Promise<{ success: boolean; message: string }>;
  onResendOtp: () => Promise<{ success: boolean; message: string }>;
  title?: string; subtitle?: string;
}

export function OtpModal({ email, isOpen, onClose, onVerify, onResendOtp, title = 'Xác minh mã OTP', subtitle = 'Mã OTP 6 chữ số đã được gửi an toàn đến' }: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false); const [resending, setResending] = useState(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [timer, setTimer] = useState(60);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setDigits(Array(6).fill('')); setError(''); setSuccess(''); setTimer(60);
    const focusTimer = window.setTimeout(() => refs.current[0]?.focus(), 100);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    const interval = window.setInterval(() => setTimer((value) => value - 1), 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, timer]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

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
    <div className="otp-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="otp-dialog" role="dialog" aria-modal="true" aria-labelledby="otp-title">
        <button className="otp-close" onClick={onClose} aria-label="Đóng"><Icon name="x" /></button>
        <span className="otp-dialog__icon"><Icon name="lock" /></span>
        <h3 id="otp-title">{title}</h3><p>{subtitle}<br /><strong>{email}</strong></p>
        {error && <div className="auth-message auth-message--error" style={{ marginTop: 16 }}><Icon name="shield" /><span>{error}</span></div>}
        {success && <div className="auth-message auth-message--success" style={{ marginTop: 16 }}><Icon name="check" /><span>{success}</span></div>}
        <form onSubmit={verify}>
          <div className="otp-inputs">{digits.map((digit, index) => <input key={index} ref={(el) => { refs.current[index] = el; }} inputMode="numeric" maxLength={6} value={digit} aria-label={`Chữ số OTP ${index + 1}`} onChange={(e) => change(index, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus(); }} />)}</div>
          <button className="auth-submit" type="submit" disabled={loading || digits.join('').length !== 6}>{loading ? <ButtonSpinner label="Đang xác minh..." /> : 'Xác nhận mã OTP'}</button>
        </form>
        <div className="otp-resend">Chưa nhận được mã? {timer > 0 ? <span>Gửi lại sau {timer}s</span> : <button type="button" onClick={resend} disabled={resending}>{resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}</button>}</div>
      </section>
    </div>
  );
}
