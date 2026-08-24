import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuthSession } from './hooks/auth/useAuthSession';
import { AuthPage } from './views/AuthPage';
import { HomeView } from './views/HomeView';
import { NewsDetailView } from './views/NewsDetailView';
import { UserProfileView } from './views/UserProfileView';
import { LandingPage } from './views/LandingPage';
import { AdminDashboardView } from './views/admin/AdminDashboardView';
import { AdminFeatureView } from './views/admin/AdminFeatureView';
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
      <Route path="/dashboard" element={isAuthenticated && user ? (canAccessAdmin(user) ? <Navigate to="/admin" replace /> : <HomeView user={user} onLogout={logout} />) : <Navigate to="/login" replace />} />
      <Route path="/dashboard/profile" element={isAuthenticated && user ? <UserProfileView user={user} onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route element={isAuthenticated && user && canAccessAdmin(user) ? <Outlet /> : <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}>
        <Route path="/admin" element={<AdminLayout user={user!} onLogout={logout} />}>
          <Route index element={<AdminDashboardView />} />
          <Route path="campaigns" element={<AdminFeatureView section="campaigns" />} />
          <Route path="campaigns/new" element={<AdminFeatureView section="campaign-create" />} />
          <Route path="applications" element={<AdminFeatureView section="applications" />} />
          <Route path="evidence" element={<AdminFeatureView section="evidence" />} />
          <Route path="collectives" element={<AdminFeatureView section="collectives" />} />
          <Route path="reports" element={<AdminFeatureView section="reports" />} />
          <Route path="settings" element={<AdminFeatureView section="settings" />} />
          <Route path="account" element={<AdminFeatureView section="account" />} />
          <Route path="change-password" element={<AdminFeatureView section="change-password" />} />
          <Route element={isAdmin(user) ? <Outlet /> : <Navigate to="/admin" replace />}>
            <Route path="standards" element={<AdminFeatureView section="standards" />} />
            <Route path="roles" element={<AdminFeatureView section="roles" />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path='/news/:newsId' element={isAuthenticated ? <NewsDetailView /> : <Navigate to='/login' replace />} />
    </Routes>
  );
}

export default App;
