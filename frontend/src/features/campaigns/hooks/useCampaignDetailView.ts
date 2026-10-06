import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCampaignDetail, useCampaignMutations } from './useCampaigns';
import { useStandardSetDetail } from '../../standards/hooks/useStandards';
import { CampaignStatus, type UpdateCampaignRequest } from '../types/campaign.types';

export function useCampaignDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: campaign, isPending, isError } = useCampaignDetail(id);
  const { data: standardSet } = useStandardSetDetail(campaign?.standardSetId);

  const {
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
  } = useCampaignMutations();

  const [activeTab, setActiveTab] = useState<'info' | 'criteria' | 'applications'>('info');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Timeline stage
  let stageLabel = 'Chưa bắt đầu';
  let progressPercent = 0;

  if (campaign) {
    const now = Date.now();
    const tOpen = new Date(campaign.regOpenAt).getTime();
    const tClose = new Date(campaign.regCloseAt).getTime();
    const tSubmit = new Date(campaign.submitDeadline).getTime();
    const tReview = new Date(campaign.reviewDeadline).getTime();

    if (now < tOpen) {
      stageLabel = 'Chưa mở cổng đăng ký';
      progressPercent = 5;
    } else if (now >= tOpen && now <= tClose) {
      stageLabel = 'Đang trong thời gian mở đăng ký';
      progressPercent = 35;
    } else if (now > tClose && now <= tSubmit) {
      stageLabel = 'Đang tiếp nhận hoàn thiện minh chứng';
      progressPercent = 65;
    } else if (now > tSubmit && now <= tReview) {
      stageLabel = 'Đang tiến hành xét duyệt hồ sơ';
      progressPercent = 85;
    } else {
      stageLabel = 'Đã hoàn thành toàn bộ các mốc thời hạn';
      progressPercent = 100;
    }
  }

  const handleEditSubmit = async (formData: unknown) => {
    if (!campaign) return;
    await updateCampaign.mutateAsync({
      id: campaign.id,
      data: formData as UpdateCampaignRequest,
    });
  };

  const handleStatusSave = async (newStatus: CampaignStatus) => {
    if (!campaign) return;
    await updateCampaignStatus.mutateAsync({
      id: campaign.id,
      request: { status: newStatus },
    });
  };

  const handleDeleteConfirm = async () => {
    if (!campaign) return;
    await deleteCampaign.mutateAsync(campaign.id);
    navigate('/admin/campaigns');
  };

  return {
    id,
    campaign,
    standardSet,
    isPending,
    isError,
    activeTab,
    setActiveTab,
    stageLabel,
    progressPercent,
    isEditModalOpen,
    setIsEditModalOpen,
    isStatusModalOpen,
    setIsStatusModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleEditSubmit,
    handleStatusSave,
    handleDeleteConfirm,
    isEditLoading: updateCampaign.isPending,
    isStatusLoading: updateCampaignStatus.isPending,
    isDeleteLoading: deleteCampaign.isPending,
    navigateToList: () => navigate('/admin/campaigns'),
  };
}
