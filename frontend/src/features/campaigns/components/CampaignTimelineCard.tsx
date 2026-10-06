import type { CampaignDetailResponse } from '../types/campaign.types';
import { Clock } from 'lucide-react';

function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export interface CampaignTimelineCardProps {
  campaign: CampaignDetailResponse;
  stageLabel: string;
  progressPercent: number;
}

export function CampaignTimelineCard({
  campaign,
  stageLabel,
  progressPercent,
}: CampaignTimelineCardProps) {
  return (
    <section className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Clock size={15} className="text-blue-600" />
          <span>Tiến độ mốc thời hạn</span>
        </div>
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
          {stageLabel}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 4 Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[11px] font-medium text-blue-600">1. Mở đăng ký</span>
          <div className="text-xs font-medium text-slate-800">{formatDateTime(campaign.regOpenAt)}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[11px] font-medium text-blue-600">2. Đóng đăng ký</span>
          <div className="text-xs font-medium text-slate-800">{formatDateTime(campaign.regCloseAt)}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[11px] font-medium text-blue-600">3. Hạn nộp minh chứng</span>
          <div className="text-xs font-medium text-slate-800">{formatDateTime(campaign.submitDeadline)}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[11px] font-medium text-blue-600">4. Hạn duyệt hồ sơ</span>
          <div className="text-xs font-medium text-slate-800">{formatDateTime(campaign.reviewDeadline)}</div>
        </div>
      </div>
    </section>
  );
}
