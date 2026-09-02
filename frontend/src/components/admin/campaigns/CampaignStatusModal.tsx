import { useState } from 'react';
import {
  CampaignStatus,
  CAMPAIGN_STATUS_LABELS,
  type CampaignDetailResponse,
  type CampaignResponse,
} from '../../../types/admin/campaign';
import { CampaignStatusBadge } from '../common/AdminStatusBadge';
import { AlertCircle, Loader2, X } from 'lucide-react';

export interface CampaignStatusModalProps {
  isOpen: boolean;
  campaign: CampaignResponse | CampaignDetailResponse | null;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (newStatus: CampaignStatus) => Promise<void> | void;
}

const STATUS_DESCRIPTIONS: Record<CampaignStatus, string> = {
  [CampaignStatus.Draft]: 'Bản nháp ban đầu, sinh viên chưa thể nhìn thấy hoặc nộp hồ sơ.',
  [CampaignStatus.Open]: 'Mở cổng tiếp nhận hồ sơ đăng ký SV5T cho sinh viên trong thời hạn quy định.',
  [CampaignStatus.Closed]: 'Đóng cổng tiếp nhận đăng ký mới, chuẩn bị chuyển sang giai đoạn chấm xét.',
  [CampaignStatus.Reviewing]: 'Hội đồng xét duyệt và Mentor tiến hành thẩm định minh chứng và đánh giá hồ sơ.',
  [CampaignStatus.Published]: 'Công bố kết quả danh sách sinh viên đạt chuẩn và hoàn tất đợt xét.',
  [CampaignStatus.Archived]: 'Lưu trữ hồ sơ đợt xét, khóa toàn bộ thao tác chỉnh sửa.',
};

export function CampaignStatusModal({
  isOpen,
  campaign,
  isLoading = false,
  onClose,
  onSave,
}: CampaignStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus>(
    campaign?.status ?? CampaignStatus.Draft,
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !campaign) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave(selectedStatus);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Không thể cập nhật trạng thái đợt xét.',
      );
    }
  };

  const statusOptions = [
    CampaignStatus.Draft,
    CampaignStatus.Open,
    CampaignStatus.Closed,
    CampaignStatus.Reviewing,
    CampaignStatus.Published,
    CampaignStatus.Archived,
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-800">
            Cập nhật trạng thái đợt xét
          </h2>
          <p className="text-xs text-slate-500">
            {campaign.name} · Hiện tại:{' '}
            <span className="font-medium text-slate-700">
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </span>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 block">
              Chọn trạng thái mới
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {statusOptions.map((st) => {
                const isSelected = selectedStatus === st;
                return (
                  <label
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="campaignStatus"
                      checked={isSelected}
                      onChange={() => setSelectedStatus(st)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CampaignStatusBadge status={st} />
                        {st === campaign.status && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Hiện tại)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-normal">
                        {STATUS_DESCRIPTIONS[st]}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedStatus === campaign.status}
              className="px-4 py-1.5 text-xs font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              <span>Lưu trạng thái</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
