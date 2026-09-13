import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
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
        <header className='profile-page-heading'>
          <div className='profile-page-heading__copy'>
            <div className='profile-page-heading__eyebrow'><Sparkles size={14} /> Không gian hồ sơ cá nhân</div>
            <h1>Cập nhật <span>thông tin cá nhân</span></h1>
            <p>Hoàn thiện một lần, sử dụng xuyên suốt hành trình xét duyệt danh hiệu Sinh viên 5 Tốt.</p>
            <div className='profile-page-heading__steps' aria-label='Hồ sơ gồm 5 nhóm thông tin'>
              <span><b>01</b> Định danh</span>
              <i aria-hidden='true' />
              <span><b>02</b> Học tập</span>
              <i aria-hidden='true' />
              <span><b>03</b> Đoàn thể</span>
              <i aria-hidden='true' />
              <span><b>04</b> Liên hệ</span>
              <i aria-hidden='true' />
              <span><b>05</b> Địa chỉ</span>
            </div>
          </div>
          <div className='profile-page-heading__visual'>
            <div className='profile-heading-orbit' aria-hidden='true'>
              <span className='profile-heading-orbit__ring profile-heading-orbit__ring--outer' />
              <span className='profile-heading-orbit__ring profile-heading-orbit__ring--inner' />
              <span className='profile-heading-orbit__dot profile-heading-orbit__dot--one'><CheckCircle2 size={15} /></span>
              <span className='profile-heading-orbit__dot profile-heading-orbit__dot--two'><ShieldCheck size={14} /></span>
              <span className='profile-heading-orbit__core'><UserRound size={35} /></span>
            </div>
            <div className='profile-heading-status'><ShieldCheck size={16} /><span><strong>Hồ sơ được bảo vệ</strong><small>Dữ liệu xác thực an toàn</small></span></div>
            <Link to='/dashboard'><ArrowLeft size={17} /> Về trang tổng quan</Link>
          </div>
        </header>
        <UserProfileForm user={user} />
      </main>
      <DashboardFooter />
    </div>
  );
}
