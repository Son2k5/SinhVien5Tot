import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentPortalService } from '../services/student-portal.service';
import {
  AwardLevel,
  AwardType,
  isDraftStatus,
  type StudentApplicationSummaryResponse,
  parseStudentPortalApiError,
} from '../types/student-portal.types';

export const studentCampaignsQueryKeys = {
  all: ['student-campaigns'] as const,
  open: (level: AwardLevel, awardType: AwardType) =>
    ['student-campaigns', 'open', level, awardType] as const,
  myApplications: ['student-applications', 'my'] as const,
};

export function useStudentCampaigns() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedLevel, setSelectedLevel] = useState<AwardLevel>(AwardLevel.School);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Query: open campaigns for selected Level (Individual)
  const { data: individualData, isLoading: individualLoading } = useQuery({
    queryKey: studentCampaignsQueryKeys.open(selectedLevel, AwardType.Individual),
    queryFn: () =>
      studentPortalService.getOpenCampaigns({
        level: selectedLevel,
        awardType: AwardType.Individual,
      }),
  });

  // Query: open campaigns for selected Level (Collective)
  const { data: collectiveData, isLoading: collectiveLoading } = useQuery({
    queryKey: studentCampaignsQueryKeys.open(selectedLevel, AwardType.Collective),
    queryFn: () =>
      studentPortalService.getOpenCampaigns({
        level: selectedLevel,
        awardType: AwardType.Collective,
      }),
  });

  const campaignsLoading = individualLoading || collectiveLoading;
  const individualCampaigns = individualData?.items ?? [];
  const collectiveCampaigns = collectiveData?.items ?? [];
  const availableCampaigns = [...individualCampaigns, ...collectiveCampaigns];
  const currentActiveCampaign = availableCampaigns[0];

  // Query: existing applications for duplicate check + draft history
  const { data: myApplicationsData, isLoading: myApplicationsLoading } = useQuery({
    queryKey: studentCampaignsQueryKeys.myApplications,
    queryFn: () => studentPortalService.getMyApplications({ pageSize: 50 }),
  });

  const myApplications = myApplicationsData?.items ?? [];
  const draftApplications = myApplications.filter((a) => isDraftStatus(a.status));
  const hasAnyDraft = draftApplications.length > 0;

  // Create Application Mutation
  const createMutation = useMutation({
    mutationFn: (campaignId: string) => studentPortalService.createApplication(campaignId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studentCampaignsQueryKeys.myApplications });
      setShowTypeModal(false);
      navigate(`/dashboard/applications/${data.id}`);
    },
    onError: (err: unknown) => {
      setActionError(parseStudentPortalApiError(err));
    },
  });

  // Delete/Cancel Draft Application Mutation
  const deleteDraftMutation = useMutation({
    mutationFn: async (app: StudentApplicationSummaryResponse) => {
      const detail = await studentPortalService.getApplicationDetail(app.id);
      return studentPortalService.withdrawApplication(app.id, detail.rowVersion, 'Hủy bản nháp');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentCampaignsQueryKeys.myApplications });
      setActionError(null);
    },
    onError: (err: unknown) => {
      setActionError(parseStudentPortalApiError(err));
    },
  });

  const handleOpenCreateModal = () => {
    setActionError(null);
    if (availableCampaigns.length === 0) {
      setActionError('Hiện chưa có chiến dịch đang mở cho cấp độ này để lập hồ sơ.');
      return;
    }
    setShowTypeModal(true);
  };

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

  return {
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
    myApplications,
    myApplicationsLoading,
    draftApplications,
    hasAnyDraft,
    createMutation,
    deleteDraftMutation,
    handleOpenCreateModal,
    handleSelectApplicationType,
  };
}
