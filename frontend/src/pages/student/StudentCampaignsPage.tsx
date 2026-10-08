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
  useStudentCampaigns,
  CampaignLevelTabs,
  EmptyCampaignNotice,
  ApplicationProcessStepper,
  DraftApplicationsSection,
  CreateApplicationTypeModal,
} from '../../features/student-portal';

interface StudentCampaignsPageProps {
  user: User;
  onLogout: () => void;
}

export const StudentCampaignsPage: React.FC<StudentCampaignsPageProps> = ({
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
    selectedLevel,
    setSelectedLevel,
    showTypeModal,
    setShowTypeModal,
    actionError,
    setActionError,
    campaignsLoading,
    individualCampaigns,
    collectiveCampaigns,
    availableCampaigns,
    currentActiveCampaign,
    myApplicationsLoading,
    draftApplications,
    hasAnyDraft,
    createMutation,
    deleteDraftMutation,
    handleOpenCreateModal,
    handleSelectApplicationType,
  } = useStudentCampaigns();

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

      <main className="flex-1 pb-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
          <div className="relative rounded-3xl bg-gradient-to-b from-[#4364f7] via-[#3a57e8] to-[#6fb1fc] pt-10 sm:pt-12 pb-14 sm:pb-16 px-6 sm:px-12 text-center text-white shadow-xl shadow-blue-500/10 border border-white/25 overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative max-w-4xl mx-auto space-y-2 sm:space-y-2.5 z-0">
              <p className="text-xs sm:text-sm font-semibold tracking-widest text-blue-100 uppercase">
                HỘI SINH VIÊN TRƯỜNG ĐẠI HỌC HÀ NỘI
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm uppercase">
                XÉT CHỌN DANH HIỆU <br className="sm:hidden" />
                <span className="text-amber-300 ml-1.5">"SINH VIÊN 5 TỐT"</span>
              </h1>
              <div className="inline-block pt-1">
                <span className="px-5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs sm:text-sm font-bold tracking-wide border border-white/30 text-white shadow-inner">
                  NĂM HỌC {currentActiveCampaign?.schoolYear || '2025 - 2026'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <CampaignLevelTabs selectedLevel={selectedLevel} onSelectLevel={setSelectedLevel} />

        {actionError && (
          <div className="max-w-5xl mx-auto mt-6 px-4">
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

        {!campaignsLoading && availableCampaigns.length === 0 && (
          <EmptyCampaignNotice level={selectedLevel} />
        )}

        <ApplicationProcessStepper
          onCreateApplication={handleOpenCreateModal}
          canCreate={availableCampaigns.length > 0}
          isCreating={createMutation.isPending}
          hasExistingDraft={hasAnyDraft}
        />

        <DraftApplicationsSection
          draftApplications={draftApplications}
          isLoading={myApplicationsLoading}
          onDeleteDraft={(app) => deleteDraftMutation.mutate(app)}
          isDeleting={deleteDraftMutation.isPending}
        />
      </main>

      <DashboardFooter />

      <CreateApplicationTypeModal
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelect={handleSelectApplicationType}
        isCreating={createMutation.isPending}
        individualDisabled={individualCampaigns.length === 0}
        collectiveDisabled={collectiveCampaigns.length === 0}
        individualHint={individualCampaigns[0]?.name}
        collectiveHint={collectiveCampaigns[0]?.name}
      />
    </div>
  );
};

export default StudentCampaignsPage;
