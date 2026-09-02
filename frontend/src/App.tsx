import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuthSession } from './hooks/auth/useAuthSession';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { LandingPage } from './pages/LandingPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminFeaturePage } from './pages/admin/AdminFeaturePage';
import { CampaignListPage } from './pages/admin/CampaignListPage';
import { CampaignDetailPage } from './pages/admin/CampaignDetailPage';
import { StandardSetListPage } from './pages/admin/StandardSetListPage';
import { StandardSetDetailPage } from './pages/admin/StandardSetDetailPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardSkeleton } from './components/common/SkeletonLoader';
import { canAccessAdmin, isAdmin, authenticatedHome } from './utils/authorization';

export function App() {
  const { user, isAuthenticated, isLoading, loginSuccess, logout } = useAuthSession();

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><DashboardSkeleton /></div>;

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={authenticatedHome(user)} replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={authenticatedHome(user)} replace /> : <AuthPage view="login" onLoginSuccess={loginSuccess} />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={authenticatedHome(user)} replace /> : <AuthPage view="register" onLoginSuccess={loginSuccess} />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to={authenticatedHome(user)} replace /> : <AuthPage view="forgot-password" onLoginSuccess={loginSuccess} />} />
      <Route path="/dashboard" element={isAuthenticated && user ? (canAccessAdmin(user) ? <Navigate to="/admin" replace /> : <HomePage user={user} onLogout={logout} />) : <Navigate to="/login" replace />} />
      <Route path="/dashboard/profile" element={isAuthenticated && user ? <UserProfilePage user={user} onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route element={isAuthenticated && user && canAccessAdmin(user) ? <Outlet /> : <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}>
        <Route path="/admin" element={<AdminLayout user={user!} onLogout={logout} />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="campaigns" element={<CampaignListPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="applications" element={<AdminFeaturePage section="applications" />} />
          <Route path="evidence" element={<AdminFeaturePage section="evidence" />} />
          <Route path="collectives" element={<AdminFeaturePage section="collectives" />} />
          <Route path="reports" element={<AdminFeaturePage section="reports" />} />
          <Route path="settings" element={<AdminFeaturePage section="settings" />} />
          <Route path="account" element={<AdminFeaturePage section="account" />} />
          <Route path="change-password" element={<AdminFeaturePage section="change-password" />} />
          <Route element={isAdmin(user) ? <Outlet /> : <Navigate to="/admin" replace />}>
            <Route path="standards" element={<StandardSetListPage />} />
            <Route path="standards/:id" element={<StandardSetDetailPage />} />
            <Route path="roles" element={<AdminFeaturePage section="roles" />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path='/news/:newsId' element={isAuthenticated ? <NewsDetailPage /> : <Navigate to='/login' replace />} />
    </Routes>
  );
}

export default App;

