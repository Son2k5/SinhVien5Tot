import { Link } from 'react-router-dom';
import {
  AwardLevelBadge,
  AwardTypeBadge,
  CampaignStatusBadge,
} from '../../../components/admin/common/AdminStatusBadge';
import {
  type CampaignDetailResponse,
} from '../types/campaign.types';
import { ArrowRight, ExternalLink } from 'lucide-react';

export interface CampaignKPIsProps {
  campaign: CampaignDetailResponse;
  stageLabel: string;
}

export function CampaignKPIs({ campaign, stageLabel }: CampaignKPIsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5">
        <span className="text-xs font-medium text-slate-500">Trạng thái hiện tại</span>
        <div className="pt-0.5">
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <p className="text-xs text-slate-500 mt-1">{stageLabel}</p>
      </div>

      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
        <span className="text-xs font-medium text-slate-500">Tổng hồ sơ đăng ký</span>
        <div className="text-2xl font-semibold text-slate-800 leading-tight pt-0.5">
          {campaign.totalApplications.toLocaleString('vi-VN')}
        </div>
        <Link
          to={`/admin/applications?campaignId=${campaign.id}`}
          className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1 pt-0.5"
        >
          <span>Quản lý hồ sơ</span> <ArrowRight size={12} />
        </Link>
      </div>

      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
        <span className="text-xs font-medium text-slate-500">Cấp & Danh hiệu</span>
        <div className="flex items-center gap-1.5 pt-0.5">
          <AwardLevelBadge level={campaign.level} />
          <AwardTypeBadge awardType={campaign.awardType} />
        </div>
        <p className="text-xs text-slate-500 mt-1">Năm học {campaign.schoolYear}</p>
      </div>

      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
        <span className="text-xs font-medium text-slate-500">Bộ tiêu chuẩn áp dụng</span>
        <div className="font-medium text-xs text-slate-800 line-clamp-1 pt-0.5">
          {campaign.standardSetName ?? `Bộ tiêu chuẩn ID: ${campaign.standardSetId.slice(0, 8)}`}
        </div>
        <Link
          to={`/admin/standards/${campaign.standardSetId}`}
          className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1 pt-0.5"
        >
          <span>Xem cây tiêu chí</span> <ExternalLink size={12} />
        </Link>
      </div>
    </section>
  );
}
