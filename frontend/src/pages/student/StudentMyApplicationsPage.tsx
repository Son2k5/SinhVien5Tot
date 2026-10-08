import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import {
  DashboardHeader,
  SystemLauncher,
  useWelcomeDashboard,
  useLauncher,
  formatUserRole,
} from '../../features/home-dashboard';
import { SiteFooter as DashboardFooter } from '../../components/common/SiteFooter';
import type { User } from '../../features/auth/types/auth.types';
import {
  useStudentMyApplications,
  MyApplicationCards,
  WithdrawApplicationModal,
} from '../../features/student-portal';

interface StudentMyApplicationsPageProps {
  user: User;
  onLogout: () => void;
}

export const StudentMyApplicationsPage: React.FC<StudentMyApplicationsPageProps> = ({
  user,
  onLogout,
}) => {
  const { displayName, avatarUrl, notifications, features } = useWelcomeDashboard(user);
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

  const {
    allApplications,
    myApplicationsLoading,
    withdrawModalApp,
    setWithdrawModalApp,
    withdrawReason,
    setWithdrawReason,
    actionError,
    setActionError,
    withdrawMutation,
    handleConfirmWithdraw,
  } = useStudentMyApplications();

  return (
    <div className="authenticated-page-background min-h-screen text-slate-800 flex flex-col font-['Inter',_sans-serif]">
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

      <main className="flex-1 pb-16">
        {actionError && (
          <div className="max-w-4xl mx-auto mt-6 px-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-rose-500 hover:text-rose-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <MyApplicationCards
          applications={allApplications}
          isLoading={myApplicationsLoading}
          onWithdraw={(app) => {
            setActionError(null);
            setWithdrawModalApp(app);
            setWithdrawReason('');
          }}
        />
      </main>

      <DashboardFooter />

      <WithdrawApplicationModal
        application={withdrawModalApp}
        withdrawReason={withdrawReason}
        onReasonChange={setWithdrawReason}
        onClose={() => setWithdrawModalApp(null)}
        onConfirm={handleConfirmWithdraw}
        isWithdrawing={withdrawMutation.isPending}
      />
    </div>
  );
};

export default StudentMyApplicationsPage;
