import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import {
  SESSION_EXPIRED_EVENT,
  startSessionInactivityMonitor,
  type SessionEndReason,
} from '../../services/sessionInactivity';
import { authenticatedHome } from '../../utils/authorization';
import type { User } from '../../types/auth';

/**
 * Quản lý toàn bộ vòng đời phiên đăng nhập của ứng dụng.
 * Trích xuất từ App.tsx để tách biệt session logic khỏi routing logic.
 *
 * Bao gồm:
 * - Khởi tạo session khi app load (initSession)
 * - Theo dõi phiên không hoạt động (inactivity monitor)
 * - Lắng nghe sự kiện hết hạn từ server (SESSION_EXPIRED_EVENT)
 * - Xử lý đăng nhập thành công (loginSuccess)
 * - Xử lý đăng xuất (logout)
 */
export function useAuthSession() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, initSession, setSession, clearSession } =
    useAuthStore();
  const sessionEndPending = useRef(false);

  const endExpiredSession = useCallback(
    (reason: SessionEndReason) => {
      if (sessionEndPending.current) return;
      sessionEndPending.current = true;
      clearSession(reason);
      navigate(
        reason === 'logout' ? '/login' : `/login?reason=${reason}`,
        { replace: true },
      );
    },
    [clearSession, navigate],
  );

  // Khởi tạo session khi app mount
  useEffect(() => {
    void initSession();
  }, [initSession]);

  // Gắn inactivity monitor + server expiry listener khi đã đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return;
    sessionEndPending.current = false;

    const stopMonitor = startSessionInactivityMonitor((reason) =>
      endExpiredSession(reason),
    );

    const handleServerExpiry = (event: Event) => {
      const reason =
        event instanceof CustomEvent ? (event.detail as SessionEndReason) : 'expired';
      endExpiredSession(reason);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleServerExpiry);
    return () => {
      stopMonitor();
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleServerExpiry);
    };
  }, [endExpiredSession, isAuthenticated]);

  const loginSuccess = useCallback(
    (authenticatedUser: User, token: string, rememberMe = false) => {
      setSession(authenticatedUser, token, rememberMe);
      navigate(authenticatedHome(authenticatedUser), { replace: true });
    },
    [setSession, navigate],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      endExpiredSession('logout');
    }
  }, [endExpiredSession]);

  return {
    user,
    isAuthenticated,
    isLoading,
    loginSuccess,
    logout,
  };
}
