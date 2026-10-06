import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuthSession } from './features/auth/hooks/useAuthSession';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';

import { UserProfilePage } from './pages/UserProfilePage';
import { StudentCampaignsPage } from './pages/student/StudentCampaignsPage';
import { StudentMyApplicationsPage } from './pages/student/StudentMyApplicationsPage';
import { StudentEvidenceSubmissionPage } from './pages/student/StudentEvidenceSubmissionPage';
import { LandingPage } from './pages/LandingPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminFeaturePage } from './pages/admin/AdminFeaturePage';
import { CampaignListPage } from './pages/admin/CampaignListPage';
import { CampaignDetailPage } from './pages/admin/CampaignDetailPage';
import { StudentListPage } from './pages/admin/StudentListPage';
import { StudentDetailPage } from './pages/admin/StudentDetailPage';
import { ApplicationListPage } from './pages/admin/ApplicationListPage';
import { EvidenceReviewWorkspacePage } from './pages/admin/EvidenceReviewWorkspacePage';
import { StandardSetListPage } from './pages/admin/StandardSetListPage';
import { StandardSetDetailPage } from './pages/admin/StandardSetDetailPage';
import { AdminLayout } from './components/admin/layout/AdminLayout';
import { DashboardSkeleton } from './components/common/SkeletonLoader';
import { canAccessAdmin, isAdmin, authenticatedHome } from './utils/authorization';

const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage'));
const ChatPage = lazy(() => import('./features/chat/ChatPage'));
const NewsListPage = lazy(() => import('./features/news/NewsListPage').then(m => ({ default: m.NewsListPage })));
const NewsDetailPage = lazy(() => import('./features/news/NewsDetailPage').then(m => ({ default: m.NewsDetailPage })));
const AdminArticlesPage = lazy(() => import('./features/news/AdminArticlesPage').then(m => ({ default: m.AdminArticlesPage })));
const AdminArticleEditorPage = lazy(() => import('./features/news/AdminArticleEditorPage').then(m => ({ default: m.AdminArticleEditorPage })));
const StaffProfilePage = lazy(() => import('./features/staff-me/StaffProfilePage').then(m => ({ default: m.StaffProfilePage })));
const StaffPage = lazy(() => import('./features/staff/StaffPage').then(m => ({ default: m.StaffPage })));

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
      <Route path="/dashboard/campaigns" element={isAuthenticated && user ? <StudentCampaignsPage user={user} onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/applications" element={isAuthenticated && user ? <StudentMyApplicationsPage user={user} onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/applications/:id" element={isAuthenticated && user ? <StudentEvidenceSubmissionPage user={user} onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard/evidence" element={<Navigate to="/dashboard/applications" replace />} />
      <Route path="/dashboard/notifications" element={isAuthenticated && user ? <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><DashboardSkeleton /></div>}><NotificationsPage user={user} onLogout={logout} /></Suspense> : <Navigate to="/login" replace />} />
      <Route path="/chat" element={isAuthenticated && user ? <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><DashboardSkeleton /></div>}><ChatPage /></Suspense> : <Navigate to="/login" replace />} />
      <Route path="/chat/:conversationId" element={isAuthenticated && user ? <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><DashboardSkeleton /></div>}><ChatPage /></Suspense> : <Navigate to="/login" replace />} />
      <Route element={isAuthenticated && user && canAccessAdmin(user) ? <Outlet /> : <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}>
        <Route path="/admin" element={<AdminLayout user={user!} onLogout={logout} />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="articles" element={<Suspense fallback={<DashboardSkeleton />}><AdminArticlesPage /></Suspense>} />
          <Route path="articles/new" element={<Suspense fallback={<DashboardSkeleton />}><AdminArticleEditorPage /></Suspense>} />
          <Route path="articles/:id/edit" element={<Suspense fallback={<DashboardSkeleton />}><AdminArticleEditorPage /></Suspense>} />
          <Route path="campaigns" element={<CampaignListPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="applications" element={<ApplicationListPage />} />
          <Route path="evidence" element={<EvidenceReviewWorkspacePage />} />
          <Route path="students" element={<StudentListPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="notifications" element={<Suspense fallback={<DashboardSkeleton />}><NotificationsPage user={user!} onLogout={logout} variant="admin" /></Suspense>} />
          <Route path="collectives" element={<AdminFeaturePage section="collectives" />} />
          <Route path="reports" element={<AdminFeaturePage section="reports" />} />
          <Route path="settings" element={<AdminFeaturePage section="settings" />} />
          <Route path="profile" element={<Suspense fallback={<DashboardSkeleton />}><StaffProfilePage /></Suspense>} />
          <Route path="account" element={<Navigate to="/admin/profile" replace />} />
          <Route path="change-password" element={<AdminFeaturePage section="change-password" />} />
          <Route element={isAdmin(user) ? <Outlet /> : <Navigate to="/admin" replace state={{ accessDeniedMessage: 'Bạn không có quyền truy cập' }} />}>
            <Route path="standards" element={<StandardSetListPage />} />
            <Route path="standards/:id" element={<StandardSetDetailPage />} />
            <Route path="roles" element={<AdminFeaturePage section="roles" />} />
            <Route path="staff" element={<Suspense fallback={<DashboardSkeleton />}><StaffPage /></Suspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
      <Route path="/news" element={<Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><DashboardSkeleton /></div>}><NewsListPage /></Suspense>} />
      <Route path="/news/:newsId" element={<Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><DashboardSkeleton /></div>}><NewsDetailPage /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

