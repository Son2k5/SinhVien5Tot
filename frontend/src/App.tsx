import { useCallback, useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AuthPage } from './views/AuthPage';
import { HomeView } from './views/HomeView';
import { NewsDetailView } from './views/NewsDetailView';
import { UserProfileView } from './views/UserProfileView';
import { LandingPage } from './views/LandingPage';
import { DashboardSkeleton } from './components/common/SkeletonLoader';
import { authService } from './services/authService';
import {
  SESSION_EXPIRED_EVENT,
  startSessionInactivityMonitor,
  type SessionEndReason,
} from './services/sessionInactivity';

export function App() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, initSession, setSession, clearSession } = useAuthStore();
  const sessionEndPending = useRef(false);

  const endExpiredSession = useCallback((reason: SessionEndReason) => {
    if (sessionEndPending.current) return;
    sessionEndPending.current = true;
    clearSession(reason);
    navigate(
      reason === 'logout' ? '/login' : `/login?reason=${reason}`,
      { replace: true },
    );
  }, [clearSession, navigate]);

  useEffect(() => { void initSession(); }, [initSession]);

  useEffect(() => {
    if (!isAuthenticated) return;
    sessionEndPending.current = false;
    const stopMonitor = startSessionInactivityMonitor(
      (reason) => endExpiredSession(reason),
    );
    const handleServerExpiry = (event: Event) => {
      const reason = event instanceof CustomEvent
        ? event.detail as SessionEndReason
        : 'expired';
      endExpiredSession(reason);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleServerExpiry);
    return () => {
      stopMonitor();
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleServerExpiry);
    };
  }, [endExpiredSession, isAuthenticated]);

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><DashboardSkeleton /></div>;

  const loginSuccess = (authenticatedUser: Parameters<typeof setSession>[0], token: string, rememberMe = false) => {
    setSession(authenticatedUser, token, rememberMe);
    navigate('/dashboard', { replace: true });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearSession('logout');
      navigate('/login', { replace: true });
    }
  };

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage view="login" onLoginSuccess={loginSuccess} />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage view="register" onLoginSuccess={loginSuccess} />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage view="forgot-password" onLoginSuccess={loginSuccess} />} />
      <Route path="/dashboard" element={isAuthenticated && user ? <HomeView user={user} onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/profile" element={isAuthenticated && user ? <UserProfileView user={user} onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path='/news/:newsId' element={isAuthenticated ? <NewsDetailView /> : <Navigate to='/login' replace />} />
    </Routes>
  );
}

export default App;
