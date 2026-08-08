import Cookies from 'js-cookie';
import type { User } from '../types/auth';

const TOKEN_KEY = 'sv5t_auth_token';
const USER_KEY = 'sv5t_user_session';
const SAVED_EMAIL_KEY = 'sv5t_remembered_email';

export const cookieStorage = {
  /**
   * Lưu Token vào Cookie an toàn (30 ngày nếu chọn Remember Me, 1 ngày nếu không)
   */
  setAuthToken(token: string, rememberMe = false): void {
    const expiresDays = rememberMe ? 30 : 1;
    Cookies.set(TOKEN_KEY, token, {
      expires: expiresDays,
      sameSite: 'Lax',
      secure: window.location.protocol === 'https:',
    });
  },

  /**
   * Lấy Token từ Cookie
   */
  getAuthToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },

  /**
   * Xóa Token khỏi Cookie
   */
  removeAuthToken(): void {
    Cookies.remove(TOKEN_KEY);
  },

  /**
   * Lưu thông tin User Session vào Cookie
   */
  setUserSession(user: User, rememberMe = false): void {
    const expiresDays = rememberMe ? 30 : 1;
    const jsonString = JSON.stringify(user);
    Cookies.set(USER_KEY, jsonString, {
      expires: expiresDays,
      sameSite: 'Lax',
      secure: window.location.protocol === 'https:',
    });
  },

  /**
   * Lấy User Session từ Cookie
   */
  getUserSession(): User | null {
    const raw = Cookies.get(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Xóa User Session khỏi Cookie
   */
  removeUserSession(): void {
    Cookies.remove(USER_KEY);
  },

  /**
   * Ghi nhớ Email đăng nhập
   */
  setSavedEmail(email: string): void {
    Cookies.set(SAVED_EMAIL_KEY, email, { expires: 30, sameSite: 'Lax' });
  },

  getSavedEmail(): string | undefined {
    return Cookies.get(SAVED_EMAIL_KEY);
  },

  removeSavedEmail(): void {
    Cookies.remove(SAVED_EMAIL_KEY);
  },

  /**
   * Xóa sạch Session và Token
   */
  clearAllSession(): void {
    this.removeAuthToken();
    this.removeUserSession();
  }
};
