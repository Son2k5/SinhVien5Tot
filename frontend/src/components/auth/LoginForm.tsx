import { useEffect, useState } from 'react';
import type { AuthView, LoginPayload } from '../../types/auth';
import { authService } from '../../services/authService';
import { Icon } from '../common/BrandLogo';
import { ButtonSpinner } from '../common/LoadingSpinner';

interface LoginFormProps {
  onLogin: (payload: LoginPayload) => Promise<{ success: boolean; message: string }>;
  onSwitchView: (view: AuthView) => void;
}

export function LoginForm({ onLogin, onSwitchView }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setEmail(authService.getSavedEmail()); }, []);

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
      <div className="auth-heading">
        <h1>Chào mừng trở lại</h1>
        <p>Đăng nhập để tiếp tục hành trình chinh phục danh hiệu Sinh viên 5 Tốt.</p>
      </div>
      {error && <div className="auth-message auth-message--error"><Icon name="shield" /><span>{error}</span></div>}
      <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="login-email">EMAIL SINH VIÊN</label>
          <div className="field-control"><Icon name="mail" /><input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="2301140097@ms.hanu.edu.vn" autoComplete="email" required /></div>
        </div>
        <div className="field">
          <label htmlFor="login-password">MẬT KHẨU</label>
          <div className="field-control"><Icon name="lock" /><input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}><Icon name={showPassword ? 'eye-off' : 'eye'} /></button></div>
        </div>
        <div className="form-meta">
          <label className="checkbox-label"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Ghi nhớ đăng nhập</label>
          <button className="form-link" type="button" onClick={() => onSwitchView('forgot-password')}>Quên mật khẩu?</button>
        </div>
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? <ButtonSpinner label="Đang đăng nhập..." /> : 'Đăng nhập'}</button>
      </form>
      <p className="auth-switch">Chưa có tài khoản?<button type="button" onClick={() => onSwitchView('register')}>Đăng ký miễn phí</button></p>
    </div>
  );
}
