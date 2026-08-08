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
      <div className="auth-heading"><h1>Tạo tài khoản mới</h1><p>Bắt đầu xây dựng hồ sơ và ghi dấu từng bước trưởng thành của bạn.</p></div>
      {error && <div className="auth-message auth-message--error"><Icon name="shield" /><span>{error}</span></div>}
      <form className="auth-form" onSubmit={submit}>
        <div className="field"><label htmlFor="register-name">HỌ VÀ TÊN</label><div className="field-control"><Icon name="user" /><input id="register-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Minh Anh" autoComplete="name" required /></div></div>
        <div className="field"><label htmlFor="register-email">EMAIL SINH VIÊN</label><div className="field-control"><Icon name="mail" /><input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="2301140097@ms.hanu.edu.vn" autoComplete="email" required /></div></div>
        <div className="field"><label htmlFor="register-password">MẬT KHẨU</label><div className="field-control"><Icon name="lock" /><input id="register-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" autoComplete="new-password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện hoặc ẩn mật khẩu"><Icon name={showPassword ? 'eye-off' : 'eye'} /></button></div><div className="password-strength">{[1,2,3].map((value) => <i key={value} className={strength >= value ? 'is-active' : ''} />)}</div><small className="password-hint">Sử dụng ít nhất 8 ký tự, bao gồm chữ và số.</small></div>
        <div className="field"><label htmlFor="register-confirm">XÁC NHẬN MẬT KHẨU</label><div className="field-control"><Icon name="key" /><input id="register-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" required /></div></div>
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? <ButtonSpinner label="Đang tạo tài khoản..." /> : 'Đăng ký và nhận mã OTP'}</button>
      </form>
      <p className="auth-switch">Đã có tài khoản?<button type="button" onClick={() => onSwitchView('login')}>Đăng nhập ngay</button></p>
    </div>
  );
}
