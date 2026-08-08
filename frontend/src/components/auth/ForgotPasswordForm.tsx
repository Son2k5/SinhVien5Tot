import { useState } from 'react';
import type { AuthView } from '../../types/auth';
import { Icon } from '../common/BrandLogo';
import { ButtonSpinner } from '../common/LoadingSpinner';

interface ForgotPasswordFormProps {
  onRequestOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  onSwitchView: (view: AuthView) => void;
}

export function ForgotPasswordForm({ onRequestOtp, onSwitchView }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập tài khoản Microsoft của trường.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await onRequestOtp(email.trim());
      if (!result.success) setError(result.message);
    } catch {
      setError('Không thể gửi OTP lúc này. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="auth-heading">
        <span className="auth-heading__icon"><Icon name="mail" /></span>
        <h1>Xác minh tài khoản</h1>
        <p>
          Nhập tài khoản Microsoft do trường cấp. Mã OTP sẽ được gửi đến hộp thư Outlook của bạn.
        </p>
      </div>
      {error && (
        <div className="auth-message auth-message--error">
          <Icon name="shield" /><span>{error}</span>
        </div>
      )}
      <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="forgot-email">TÀI KHOẢN MICROSOFT HANU</label>
          <div className="field-control">
            <Icon name="mail" />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="2301140097@ms.hanu.edu.vn"
              autoComplete="email"
              required
            />
          </div>
        </div>
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading
            ? <ButtonSpinner label="Đang gửi OTP..." />
            : 'Gửi mã OTP qua Outlook'}
        </button>
      </form>
      <button className="back-to-login" type="button" onClick={() => onSwitchView('login')}>
        <Icon name="arrow-left" /> Quay lại đăng nhập
      </button>
    </div>
  );
}
