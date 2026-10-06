import React from 'react';
import { useAuthSession } from '../../features/auth';
import { LandingHeader } from '../../features/landing';
import {
  DashboardHeader,
  SystemLauncher,
  useWelcomeDashboard,
  useLauncher,
  formatUserRole,
} from '../../features/home-dashboard';
import type { User } from '../../features/auth/types/auth.types';

interface AppHeaderProps {
  scrolled: boolean;
  scrollProgress: number;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const { user, isAuthenticated, logout } = useAuthSession();

  if (isAuthenticated && user) {
    return <AuthenticatedHeader user={user} onLogout={logout} />;
  }

  return (
    <>
      <LandingHeader {...props} />
      <div className="h-20 shrink-0" aria-hidden="true" />
    </>
  );
};

const AuthenticatedHeader: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
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
    <>
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
    </>
  );
};
