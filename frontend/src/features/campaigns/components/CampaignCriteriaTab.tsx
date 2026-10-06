import { Link } from 'react-router-dom';
import type { CampaignDetailResponse } from '../types/campaign.types';
import type { StandardResponse } from '../../standards/types/standard.types';
import { CriterionTree } from '../../standards/components/CriterionTree';
import { ExternalLink } from 'lucide-react';

export interface CampaignCriteriaTabProps {
  campaign: CampaignDetailResponse;
  standards?: StandardResponse[] | null;
}

export function CampaignCriteriaTab({ campaign, standards }: CampaignCriteriaTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-xl border border-blue-100">
        <div className="text-xs text-blue-900">
          Bộ tiêu chuẩn áp dụng:{' '}
          <span className="font-medium">{campaign.standardSetName ?? campaign.standardSetId}</span>
        </div>
        <Link
          to={`/admin/standards/${campaign.standardSetId}`}
          className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          <span>Xem cấu hình chuẩn</span> <ExternalLink size={12} />
        </Link>
      </div>

      {standards ? (
        <CriterionTree standards={standards} isEditable={false} />
      ) : (
        <div className="p-8 text-center text-xs text-slate-400">Đang tải cây tiêu chí...</div>
      )}
    </div>
  );
}
