import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { SystemLauncher } from '../components/dashboard/SystemLauncher';
import { formatUserRole } from '../components/dashboard/home/homeDashboardConfig';
import { UserProfileForm } from '../components/profile/UserProfileForm';
import { useWelcomeDashboard } from '../hooks/dashboard/useWelcomeDashboard';
import { useLauncher } from '../hooks/dashboard/useLauncher';
import type { User } from '../types/auth';
import './HomePage.css';
import './UserProfilePage.css';

interface UserProfilePageProps {
  user: User;
  onLogout: () => void;
}

export function UserProfilePage({ user, onLogout }: UserProfilePageProps) {
  const {
    displayName,
    avatarUrl,
    notifications,
    features,
  } = useWelcomeDashboard(user);

  const {
    launcherOpen,
    featureSearch,
    filteredFeatures,
    featureGroups,
    launcherButtonRef,
    launcherSearchRef,
    openLauncher,
    closeLauncher,
    toggleLauncher,
    setFeatureSearch,
  } = useLauncher(features);

  return (
    <div className='sv-dashboard min-h-screen'>
      <DashboardHeader
        displayName={displayName}
        role={formatUserRole(user.role)}
        avatarUrl={avatarUrl}
        notificationCount={notifications.length}
        launcherOpen={launcherOpen}
        menuButtonRef={launcherButtonRef}
        onToggleLauncher={toggleLauncher}
        onOpenLauncher={openLauncher}
        onLogout={onLogout}
      />
      <SystemLauncher
        open={launcherOpen}
        searchValue={featureSearch}
        featureGroups={featureGroups}
        filteredCount={filteredFeatures.length}
        searchInputRef={launcherSearchRef}
        onSearchChange={setFeatureSearch}
        onClose={closeLauncher}
        onLogout={onLogout}
      />

      <main id='profile-content' tabIndex={-1} className='profile-page'>
        {/* Banner - Pure Tailwind CSS with Font Inter */}
        <header className="mb-6 rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-inter">
          <div className="min-w-0 space-y-1">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
              <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
                Trang tổng quan
              </Link>
              <span className="text-slate-300" aria-hidden="true">/</span>
              <span className="text-slate-700">Thông tin cá nhân</span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Cập nhật thông tin cá nhân
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-2xl">
              Hoàn thiện thông tin cá nhân phục vụ quá trình xét duyệt danh hiệu Sinh viên 5 Tốt.
            </p>
          </div>

          <div className="shrink-0 pt-1 sm:pt-0">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] transition-all shadow-2xs"
            >
              <ArrowLeft size={16} className="text-slate-500" />
              <span>Về trang tổng quan</span>
            </Link>
          </div>
        </header>
        <UserProfileForm user={user} />
      </main>
      <DashboardFooter />
    </div>
  );
}
