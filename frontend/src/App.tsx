import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AuthPage } from './views/AuthPage';
import { HomeView } from './views/HomeView';
import { LandingPage } from './views/LandingPage';
import { DashboardSkeleton } from './components/common/SkeletonLoader';
import { authService } from './services/authService';

export function App() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, initSession, setSession, clearSession } = useAuthStore();

  useEffect(() => { void initSession(); }, [initSession]);

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><DashboardSkeleton /></div>;

  const loginSuccess = (authenticatedUser: Parameters<typeof setSession>[0], token: string, rememberMe = false) => {
    setSession(authenticatedUser, token, rememberMe);
    navigate('/dashboard', { replace: true });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
      navigate('/login', { replace: true });
    }
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage isAuthenticated={isAuthenticated} />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage view="login" onLoginSuccess={loginSuccess} />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage view="register" onLoginSuccess={loginSuccess} />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage view="forgot-password" onLoginSuccess={loginSuccess} />} />
      <Route path="/dashboard" element={isAuthenticated && user ? <HomeView user={user} onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
