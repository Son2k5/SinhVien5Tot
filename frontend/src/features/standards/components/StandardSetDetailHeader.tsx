import {
  RotateCcw,
  Zap,
  FolderPlus,
  Upload,
  Trash2,
} from 'lucide-react';
import { AdminPageHeader } from '../../../components/admin/common/AdminPageHeader';
import {
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
} from '../../campaigns/types/campaign.types';
import {
  StandardSetStatus,
  type StandardSetResponse,
  type StandardGroupCode,
} from '../types/standard.types';

interface StandardSetDetailHeaderProps {
  standardSet: StandardSetResponse;
  isDraft: boolean;
  isIndividual: boolean;
  standardsCount: number;
  groupStatus: {
    checklist: Array<{ code: StandardGroupCode; label: string; isComplete: boolean }>;
    completeCount: number;
    isAllReady: boolean;
  } | null;
  isUnpublishPending: boolean;
  isInitDefaultsPending: boolean;
  onUnpublish: () => void;
  onQuickInit: () => void;
  onAddGroup: () => void;
  onPublish: () => void;
  onDeleteSet: () => void;
}

export function StandardSetDetailHeader({
  standardSet,
  isDraft,
  isIndividual,
  standardsCount,
  groupStatus,
  isUnpublishPending,
  isInitDefaultsPending,
  onUnpublish,
  onQuickInit,
  onAddGroup,
  onPublish,
  onDeleteSet,
}: StandardSetDetailHeaderProps) {
  return (
    <AdminPageHeader
      title={standardSet.name || `Bộ tiêu chuẩn ${standardSet.academicYear}`}
      description={`${AWARD_LEVEL_LABELS[standardSet.level]} · ${AWARD_TYPE_LABELS[standardSet.awardType]}`}
      breadcrumbs={[
        { label: 'Cấu hình tiêu chuẩn', to: '/admin/standards' },
        { label: standardSet.name || `Năm học ${standardSet.academicYear}` },
      ]}
      backTo="/admin/standards"
      actions={
        <div className="flex items-center gap-2">
          {standardSet.status === StandardSetStatus.Published && (
            <button
              type="button"
              onClick={onUnpublish}
              disabled={isUnpublishPending}
              className="h-9 px-3 rounded-lg font-medium text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw size={14} />
              <span>Hoàn lại về nháp</span>
            </button>
          )}

          {isDraft && (
            <>
              {standardsCount < 5 && isIndividual && (
                <button
                  type="button"
                  onClick={onQuickInit}
                  disabled={isInitDefaultsPending}
                  className="h-9 px-3 rounded-lg font-medium text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Zap size={14} className="text-indigo-600" />
                  <span>Khởi tạo 5 tiêu chuẩn</span>
                </button>
              )}

              <button
                type="button"
                onClick={onAddGroup}
                className="h-9 px-3 rounded-lg font-medium text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FolderPlus size={14} />
                <span>Thêm tiêu chuẩn lớn</span>
              </button>

              <button
                type="button"
                onClick={onPublish}
                disabled={Boolean(isIndividual && groupStatus && !groupStatus.isAllReady)}
                className="h-9 px-3.5 rounded-lg font-medium text-xs text-white bg-sky-500 hover:bg-sky-600 active:scale-95 shadow-sm shadow-sky-500/25 inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Upload size={14} className="shrink-0" />
                <span>Công bố tiêu chuẩn</span>
              </button>

              <button
                type="button"
                onClick={onDeleteSet}
                className="h-9 px-3 rounded-lg font-medium text-xs text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Xóa bộ tiêu chuẩn"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      }
    />
  );
}
