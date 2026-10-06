import {
  AwardType,
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
  type CampaignDetailResponse,
} from '../types/campaign.types';
import { Code2 } from 'lucide-react';

export interface CampaignInfoTabProps {
  campaign: CampaignDetailResponse;
}

export function CampaignInfoTab({ campaign }: CampaignInfoTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-800">Mô tả đợt xét</h3>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200 whitespace-pre-line">
            {campaign.description || 'Chưa có mô tả chi tiết cho đợt xét này.'}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-800">Cấu hình tiên quyết & Phân cấp</h3>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Cấp xét duyệt:</span>
              <span className="text-slate-800 font-medium">{AWARD_LEVEL_LABELS[campaign.level]}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Loại danh hiệu:</span>
              <span className="text-slate-800 font-medium">{AWARD_TYPE_LABELS[campaign.awardType]}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Đợt xét tiên quyết:</span>
              <span className="text-slate-800 font-medium">
                {campaign.prerequisiteCampaignName ?? 'Không yêu cầu (Cấp cơ sở)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {campaign.awardType === AwardType.Collective && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Code2 size={15} className="text-blue-600" />
            <h3 className="text-xs font-semibold text-slate-800">Quy tắc xét chuẩn tập thể (JSON)</h3>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-900 text-sky-300 font-mono text-xs overflow-x-auto">
            {campaign.collectiveEligibilityRuleJson}
          </pre>
        </div>
      )}
    </div>
  );
}
