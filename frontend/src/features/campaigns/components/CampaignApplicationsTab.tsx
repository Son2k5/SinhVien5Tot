import { Link } from 'react-router-dom';
import type { CampaignDetailResponse } from '../types/campaign.types';
import { ArrowRight, FileCheck2 } from 'lucide-react';

export interface CampaignApplicationsTabProps {
  campaign: CampaignDetailResponse;
}

export function CampaignApplicationsTab({ campaign }: CampaignApplicationsTabProps) {
  return (
    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
        <FileCheck2 size={24} />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-800">
          {campaign.totalApplications} hồ sơ đã tiếp nhận
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Chuyển sang module Hồ sơ đăng ký để lọc, phân loại theo trạng thái và thẩm định chi tiết từng minh chứng.
        </p>
      </div>
      <Link
        to={`/admin/applications?campaignId=${campaign.id}`}
        className="px-4 py-2 rounded-lg font-medium text-xs text-white bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-1.5 transition-colors"
      >
        <span>Xem danh sách hồ sơ</span> <ArrowRight size={14} />
      </Link>
    </div>
  );
}
