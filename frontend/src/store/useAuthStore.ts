import { create } from 'zustand';
import type { User } from '../types/auth';
import { cookieStorage } from '../utils/cookieStorage';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setSession: (user: User, token: string, rememberMe?: boolean) => void;
  clearSession: () => void;
  initSession: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Khởi tạo phiên làm việc từ Cookie lưu sẵn
   */
  initSession: async () => {
    const session = await authService.restoreSession();

    if (session.success && session.data) {
      const { token, user } = session.data;
      cookieStorage.setUserSession(user);
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Thiết lập phiên làm việc sau khi Đăng nhập/Đăng ký thành công
   */
  setSession: (user: User, token: string, rememberMe = false) => {
    cookieStorage.setAuthToken(token, rememberMe);
    cookieStorage.setUserSession(user, rememberMe);

    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Đăng xuất & Dọn dẹp phiên làm việc
   */
  clearSession: () => {
    cookieStorage.clearAllSession();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  /**
   * Cập nhật thông tin User mượt mà
   */
  updateUser: (updatedFields: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const newUserData = { ...currentUser, ...updatedFields };
    cookieStorage.setUserSession(newUserData);

    set({ user: newUserData });
  },
}));
