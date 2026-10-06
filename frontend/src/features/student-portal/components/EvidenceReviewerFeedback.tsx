import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { EvidenceStatus } from '../types/student-portal.types';

interface EvidenceReviewerFeedbackProps {
  status: EvidenceStatus;
  reviewerNote?: string | null;
  reviewedAt?: string | null;
}

export const EvidenceReviewerFeedback: React.FC<EvidenceReviewerFeedbackProps> = ({
  status,
  reviewerNote,
  reviewedAt,
}) => {
  if (!reviewerNote && status !== EvidenceStatus.NeedsRevision && status !== EvidenceStatus.Rejected) {
    return null;
  }

  const isNeedsRevision = status === EvidenceStatus.NeedsRevision;
  const isRejected = status === EvidenceStatus.Rejected;
  const isApproved = status === EvidenceStatus.Approved;

  const getStyle = () => {
    if (isNeedsRevision) {
      return {
        bg: 'bg-amber-50/90 border-amber-200',
        text: 'text-amber-800',
        title: 'Yêu cầu bổ sung từ Mentor / Thẩm định viên:',
        badge: 'Cần bổ sung',
      };
    }
    if (isRejected) {
      return {
        bg: 'bg-rose-50/90 border-rose-200',
        text: 'text-rose-800',
        title: 'Lý do từ chối từ Thẩm định viên:',
        badge: 'Không đạt',
      };
    }
    if (isApproved) {
      return {
        bg: 'bg-emerald-50/90 border-emerald-200',
        text: 'text-emerald-800',
        title: 'Nhận xét của Thẩm định viên:',
        badge: 'Đạt yêu cầu',
      };
    }
    return {
      bg: 'bg-slate-50 border-slate-200',
      text: 'text-slate-700',
      title: 'Nhận xét từ Thẩm định viên:',
      badge: 'Ghi chú',
    };
  };

  const style = getStyle();

  return (
    <div className={`p-3.5 sm:p-4 rounded-xl border ${style.bg} ${style.text} text-xs space-y-1.5 mt-3`}>
      <div className="flex items-center justify-between font-bold">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{style.title}</span>
        </div>
        {reviewedAt && (
          <div className="flex items-center gap-1 text-[11px] font-normal opacity-75">
            <Clock className="w-3 h-3" />
            <span>{new Date(reviewedAt).toLocaleDateString('vi-VN')}</span>
          </div>
        )}
      </div>
      {reviewerNote ? (
        <p className="leading-relaxed whitespace-pre-wrap pl-5">{reviewerNote}</p>
      ) : (
        <p className="leading-relaxed italic pl-5">Chưa có ghi chú chi tiết.</p>
      )}
    </div>
  );
};
