import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardFooter } from '../../components/dashboard/DashboardFooter';
import { SystemLauncher } from '../../components/dashboard/SystemLauncher';
import { useWelcomeDashboard } from '../../hooks/dashboard/useWelcomeDashboard';
import { useLauncher } from '../../hooks/dashboard/useLauncher';
import { formatUserRole } from '../../components/dashboard/home/homeDashboardConfig';
import type { User } from '../../types/auth';
import { AwardLevel, AwardType, isDraftStatus, type StudentApplicationSummaryResponse } from '../../types/student';
import { studentService } from '../../services/studentService';
import { sanitizeApiError } from '../../services/apiErrorSanitizer';
import { CampaignLevelTabs } from '../../components/student/CampaignLevelTabs';
import { ApplicationProcessStepper } from '../../components/student/ApplicationProcessStepper';
import { EmptyCampaignNotice } from '../../components/student/EmptyCampaignNotice';
import { DraftApplicationsSection } from '../../components/student/DraftApplicationsSection';
import { CreateApplicationTypeModal } from '../../components/student/CreateApplicationTypeModal';
import { AlertCircle, X } from 'lucide-react';

interface StudentCampaignsPageProps {
  user: User;
  onLogout: () => void;
}

export const StudentCampaignsPage: React.FC<StudentCampaignsPageProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedLevel, setSelectedLevel] = useState<AwardLevel>(AwardLevel.School);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // System header & launcher
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

  // Query: open campaigns for selected Level — fetch BOTH award types so the
  // single "Tạo hồ sơ mới" popup can offer Cá nhân / Tập thể (mock).
  const { data: individualData, isLoading: individualLoading } = useQuery({
    queryKey: ['open-campaigns', selectedLevel, AwardType.Individual],
    queryFn: () =>
      studentService.getOpenCampaigns({
        level: selectedLevel,
        awardType: AwardType.Individual,
      }),
  });

  const { data: collectiveData, isLoading: collectiveLoading } = useQuery({
    queryKey: ['open-campaigns', selectedLevel, AwardType.Collective],
    queryFn: () =>
      studentService.getOpenCampaigns({
        level: selectedLevel,
        awardType: AwardType.Collective,
      }),
  });

  const campaignsLoading = individualLoading || collectiveLoading;
  const individualCampaigns = individualData?.items ?? [];
  const collectiveCampaigns = collectiveData?.items ?? [];
  const availableCampaigns = [...individualCampaigns, ...collectiveCampaigns];
  const currentActiveCampaign = availableCampaigns[0];

  // Query: existing applications — duplicate check + draft history (chưa nộp)
  const { data: myApplicationsData, isLoading: myApplicationsLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => studentService.getMyApplications({ pageSize: 50 }),
  });

  const myApplications = myApplicationsData?.items ?? [];
  const draftApplications = myApplications.filter((a) => isDraftStatus(a.status));
  const hasAnyDraft = draftApplications.length > 0;

  // Create Application Mutation
  const createMutation = useMutation({
    mutationFn: (campaignId: string) => studentService.createApplication(campaignId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      setShowTypeModal(false);
      navigate(`/dashboard/applications/${data.id}`);
    },
    onError: (err: any) => {
      const msg = sanitizeApiError(err);
      setActionError(msg);
    },
  });

  // Delete/Cancel Draft Application Mutation
  const deleteDraftMutation = useMutation({
    mutationFn: async (app: StudentApplicationSummaryResponse) => {
      const detail = await studentService.getApplicationDetail(app.id);
      return studentService.withdrawApplication(app.id, detail.rowVersion, 'Hủy bản nháp');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      setActionError(null);
    },
    onError: (err: any) => {
      const msg = sanitizeApiError(err);
      setActionError(msg);
    },
  });

  // Single "Tạo hồ sơ mới" button -> open popup chọn Cá nhân / Tập thể (mock)
  const handleOpenCreateModal = () => {
    setActionError(null);
    if (availableCampaigns.length === 0) {
      setActionError('Hiện chưa có chiến dịch đang mở cho cấp độ này để lập hồ sơ.');
      return;
    }
    setShowTypeModal(true);
  };

  // User picks a type inside the popup -> resolve campaign of that type
  const handleSelectApplicationType = (type: AwardType) => {
    setActionError(null);
    const target =
      type === AwardType.Individual ? individualCampaigns[0] : collectiveCampaigns[0];
    if (!target) {
      setActionError(
        type === AwardType.Individual
          ? 'Hiện chưa có chiến dịch Cá nhân đang mở cho cấp độ này.'
          : 'Hiện chưa có chiến dịch Tập thể đang mở cho cấp độ này.'
      );
      return;
    }
    const existing = myApplications.find((a) => a.campaignId === target.id);
    if (existing) {
      setShowTypeModal(false);
      navigate(`/dashboard/applications/${existing.id}`);
      return;
    }
    createMutation.mutate(target.id);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-['Inter',_sans-serif]">
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
        {/* Top Hero Banner */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
          <div className="relative rounded-3xl bg-gradient-to-b from-[#4364f7] via-[#3a57e8] to-[#6fb1fc] pt-10 sm:pt-12 pb-14 sm:pb-16 px-6 sm:px-12 text-center text-white shadow-xl shadow-blue-500/10 border border-white/25 overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />

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

        {/* Level selector: Cấp trường, Cấp thành phố, Cấp trung ương */}
        <CampaignLevelTabs
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
        />

        {/* Action Error if any */}
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

        {/* Empty campaign notice if no active campaign for this level */}
        {!campaignsLoading && availableCampaigns.length === 0 && (
          <EmptyCampaignNotice level={selectedLevel} />
        )}

        {/* 1. Quy trình & Nút "Tạo hồ sơ mới" duy nhất mở popup (thay vì 2 nút sẵn) */}
        <ApplicationProcessStepper
          onCreateApplication={handleOpenCreateModal}
          canCreate={availableCampaigns.length > 0}
          isCreating={createMutation.isPending}
          hasExistingDraft={hasAnyDraft}
        />

        {/* 2. Template: CÁC MINH CHỨNG ĐANG XÉT (Lịch sử các bản nháp chưa nộp - theo đúng Mockup 1) */}
        <DraftApplicationsSection
          draftApplications={draftApplications}
          isLoading={myApplicationsLoading}
          onDeleteDraft={(app) => deleteDraftMutation.mutate(app)}
          isDeleting={deleteDraftMutation.isPending}
        />
      </main>

      <DashboardFooter />

      {/* Popup chọn loại hồ sơ: Cá nhân / Tập thể (theo đúng Mockup 2 - Chế Độ Minh Chứng) */}
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
