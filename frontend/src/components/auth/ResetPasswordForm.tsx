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
      <div className="auth-heading">
        <span className="auth-heading__icon"><Icon name="key" /></span>
        <h1>Tạo mật khẩu mới</h1>
        <p>OTP đã được xác minh cho <strong>{email}</strong>. Bây giờ bạn có thể đặt mật khẩu mới.</p>
      </div>
      <div className="auth-message auth-message--success">
        <Icon name="check" /><span>Xác minh Outlook thành công.</span>
      </div>
      {error && (
        <div className="auth-message auth-message--error">
          <Icon name="shield" /><span>{error}</span>
        </div>
      )}
      <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="reset-password">MẬT KHẨU MỚI</label>
          <div className="field-control">
            <Icon name="lock" />
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
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} />
            </button>
          </div>
          <div className="password-strength">
            {[1, 2, 3].map((value) => <i key={value} className={strength >= value ? 'is-active' : ''} />)}
          </div>
          <small className="password-hint">Sử dụng ít nhất 8 ký tự, bao gồm chữ và số.</small>
        </div>
        <div className="field">
          <label htmlFor="reset-confirm">XÁC NHẬN MẬT KHẨU</label>
          <div className="field-control">
            <Icon name="key" />
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
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading
            ? <ButtonSpinner label="Đang cập nhật mật khẩu..." />
            : 'Cập nhật mật khẩu'}
        </button>
      </form>
      <button className="back-to-login" type="button" onClick={onBackToLogin}>
        <Icon name="arrow-left" /> Quay lại đăng nhập
      </button>
    </div>
  );
}
