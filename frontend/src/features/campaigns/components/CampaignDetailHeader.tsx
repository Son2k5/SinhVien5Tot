import { AdminPageHeader } from '../../../components/admin/common/AdminPageHeader';
import {
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
  CampaignStatus,
  type CampaignDetailResponse,
} from '../types/campaign.types';
import { Edit2, Trash2 } from 'lucide-react';

export interface CampaignDetailHeaderProps {
  campaign: CampaignDetailResponse;
  onOpenStatusModal: () => void;
  onOpenEditModal: () => void;
  onOpenDeleteModal: () => void;
}

export function CampaignDetailHeader({
  campaign,
  onOpenStatusModal,
  onOpenEditModal,
  onOpenDeleteModal,
}: CampaignDetailHeaderProps) {
  const isDraft = campaign.status === CampaignStatus.Draft;
  const isClosedOrArchived =
    campaign.status === CampaignStatus.Closed ||
    campaign.status === CampaignStatus.Archived;

  return (
    <AdminPageHeader
      title={campaign.name}
      description={`Năm học ${campaign.schoolYear} · ${AWARD_LEVEL_LABELS[campaign.level]} · ${AWARD_TYPE_LABELS[campaign.awardType]}`}
      breadcrumbs={[
        { label: 'Chiến dịch', to: '/admin/campaigns' },
        { label: campaign.name },
      ]}
      backTo="/admin/campaigns"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenStatusModal}
            className="h-9 px-3.5 rounded-lg font-medium text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>Đổi trạng thái</span>
          </button>

          <button
            type="button"
            onClick={onOpenEditModal}
            disabled={isClosedOrArchived}
            className="h-9 px-3.5 rounded-lg font-medium text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Edit2 size={14} />
            <span>Chỉnh sửa</span>
          </button>

          <button
            type="button"
            onClick={onOpenDeleteModal}
            disabled={!isDraft || campaign.totalApplications > 0}
            className="h-9 px-3 rounded-lg font-medium text-xs text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              !isDraft
                ? 'Chỉ có thể xoá chiến dịch ở trạng thái Nháp'
                : campaign.totalApplications > 0
                ? 'Không thể xoá chiến dịch đã có hồ sơ'
                : 'Xoá chiến dịch nháp'
            }
          >
            <Trash2 size={14} />
          </button>
        </div>
      }
    />
  );
}
