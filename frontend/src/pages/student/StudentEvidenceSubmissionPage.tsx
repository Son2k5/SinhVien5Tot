import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
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
  useStudentEvidenceSubmission,
  StandardGroupTabs,
  CriterionEvidenceForm,
  EvidenceSubmissionHero,
  SubmissionConfirmationModal,
  ClearDraftConfirmationModal,
  SubmissionGuideModal,
  SubmissionActionBar,
  EvidenceSubNavbar,
} from '../../features/student-portal';

interface StudentEvidenceSubmissionPageProps {
  user: User;
  onLogout: () => void;
}

export const StudentEvidenceSubmissionPage: React.FC<StudentEvidenceSubmissionPageProps> = ({
  user,
  onLogout,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    application,
    appLoading,
    appError,
    campaign,
    campaignLoading,
    evidencesMap,
    totalCriteria,
    completedCount,
    progressPercent,
    isEditable,
    isExpired,
    activeGroupCode,
    setActiveGroupCode,
    isSubmitModalOpen,
    setIsSubmitModalOpen,
    isClearModalOpen,
    setIsClearModalOpen,
    isClearing,
    isGuideModalOpen,
    setIsGuideModalOpen,
    agreementChecked,
    setAgreementChecked,
    actionError,
    setActionError,
    successNotification,
    setSuccessNotification,
    submitMutation,
    handleClearAllEvidences,
    handleEvidenceUpdated,
  } = useStudentEvidenceSubmission(id);

  if (appLoading || campaignLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-6 font-['Inter',_sans-serif]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Đang tải hồ sơ minh chứng...</p>
      </div>
    );
  }

  if (appError || !application) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-6 font-['Inter',_sans-serif]">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy hồ sơ minh chứng</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md text-center">
          Hồ sơ không tồn tại hoặc bạn không có quyền truy cập. Vui lòng quay lại danh sách hồ sơ.
        </p>
        <button
          onClick={() => navigate('/dashboard/applications')}
          className="mt-5 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const allCriteria = campaign?.criteria ?? [];
  const activeCriteria = allCriteria.filter((c) => {
    const cg = (c.groupCode || '').trim().toLowerCase();
    const ag = activeGroupCode.trim().toLowerCase();
    return cg === ag;
  });

  const canSubmit = isEditable && !isExpired && completedCount > 0;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-['Inter',_sans-serif]">
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

      {/* Sub Navigation Bar */}
      <EvidenceSubNavbar status={application.status} />

      <main className="flex-1 pb-28">
        <EvidenceSubmissionHero
          application={application}
          campaign={campaign}
          completedCount={completedCount}
          totalCriteria={totalCriteria}
          progressPercent={progressPercent}
          onOpenGuide={() => setIsGuideModalOpen(true)}
        />

        {/* Notifications */}
        {actionError && (
          <div className="max-w-5xl mx-auto mt-4 px-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
              <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {successNotification && (
          <div className="max-w-5xl mx-auto mt-4 px-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successNotification}</span>
              </div>
              <button onClick={() => setSuccessNotification(null)} className="text-emerald-500 hover:text-emerald-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Standard Group Tabs */}
        <div className="mt-8">
          <StandardGroupTabs
            activeGroupCode={activeGroupCode}
            onSelectGroup={setActiveGroupCode}
            criteria={allCriteria}
            evidences={application.evidences}
          />
        </div>

        {/* Criteria List */}
        <div className="max-w-5xl mx-auto px-4 mt-6 space-y-4">
          {activeCriteria.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-sm border border-slate-200">
              Chưa có tiêu chí nào trong tiêu chuẩn này.
            </div>
          ) : (
            activeCriteria.map((criterion, idx) => (
              <CriterionEvidenceForm
                key={criterion.id}
                criterion={criterion}
                evidence={evidencesMap.get(criterion.id)}
                applicationId={application.id}
                indexNumber={idx + 1}
                isReadOnly={!isEditable}
                onEvidenceUpdated={handleEvidenceUpdated}
              />
            ))
          )}
        </div>
      </main>

      <SubmissionActionBar
        completedCount={completedCount}
        totalCriteria={totalCriteria}
        isEditable={isEditable}
        canSubmit={canSubmit}
        isSubmitting={submitMutation.isPending}
        isClearing={isClearing}
        onClearAll={() => setIsClearModalOpen(true)}
        onSubmit={() => setIsSubmitModalOpen(true)}
      />

      <SubmissionConfirmationModal
        open={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={() => submitMutation.mutate()}
        isSubmitting={submitMutation.isPending}
        agreementChecked={agreementChecked}
        onAgreementChange={setAgreementChecked}
        applicationCode={application.applicationCode}
      />

      <ClearDraftConfirmationModal
        open={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearAllEvidences}
        isClearing={isClearing}
      />

      <SubmissionGuideModal
        open={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <DashboardFooter />
    </div>
  );
};

export default StudentEvidenceSubmissionPage;
