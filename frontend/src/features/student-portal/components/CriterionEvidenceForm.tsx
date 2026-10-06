import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Minus,
  PenLine,
  Award,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import type {
  StudentCriterionItemResponse,
  StudentEvidenceItemResponse,
} from '../types/student-portal.types';
import { EvidenceStatus } from '../types/student-portal.types';
import { useCriterionEvidenceItem } from '../hooks/useCriterionEvidenceItem';
import { EvidenceFileUploadZone } from './EvidenceFileUploadZone';
import { EvidenceAttachmentList } from './EvidenceAttachmentList';
import { EvidenceReviewerFeedback } from './EvidenceReviewerFeedback';

interface CriterionEvidenceFormProps {
  criterion: StudentCriterionItemResponse;
  evidence?: StudentEvidenceItemResponse | null;
  applicationId: string;
  indexNumber: number;
  isReadOnly?: boolean;
  onEvidenceUpdated: (evidence: StudentEvidenceItemResponse) => void;
}

export const CriterionEvidenceForm: React.FC<CriterionEvidenceFormProps> = ({
  criterion,
  evidence,
  applicationId,
  indexNumber,
  isReadOnly = false,
  onEvidenceUpdated,
}) => {
  const {
    isExpanded,
    setIsExpanded,
    description,
    setDescription,
    driveLink,
    setDriveLink,
    isSaving,
    isUploading,
    errorMessage,
    successToast,
    attachments,
    handleSaveEvidence,
    handleFileUpload,
    handleDeleteFile,
    handleReopenEvidence,
  } = useCriterionEvidenceItem({
    criterion,
    evidence,
    applicationId,
    onEvidenceUpdated,
  });

  const [confirmModalState, setConfirmModalState] = useState<'save' | 'submit' | null>(null);

  const isApproved = evidence?.status === EvidenceStatus.Approved;
  const isSubmitted = evidence?.status === EvidenceStatus.Submitted;
  const isNeedsRevision = evidence?.status === EvidenceStatus.NeedsRevision;

  const canEdit = !isReadOnly && !isApproved && (!isSubmitted || isNeedsRevision);
  const canUndo = !isReadOnly && (isSubmitted || Boolean(evidence && !isApproved));

  const getStatusBadge = () => {
    if (!evidence) {
      return {
        label: 'Chưa khai báo',
        bgColor: 'bg-slate-100 text-slate-600 border-slate-200',
        dotColor: 'bg-slate-400',
      };
    }
    switch (evidence.status) {
      case EvidenceStatus.Approved:
        return {
          label: 'Đạt',
          bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotColor: 'bg-emerald-500',
        };
      case EvidenceStatus.NeedsRevision:
        return {
          label: 'Cần bổ sung',
          bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
          dotColor: 'bg-amber-500',
        };
      case EvidenceStatus.Rejected:
        return {
          label: 'Không đạt',
          bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
          dotColor: 'bg-rose-500',
        };
      case EvidenceStatus.Submitted:
        return {
          label: 'Đã nộp thẩm định',
          bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
          dotColor: 'bg-blue-500',
        };
      default:
        return {
          label: 'Đã lưu nháp',
          bgColor: 'bg-sky-50 text-sky-700 border-sky-200',
          dotColor: 'bg-sky-500',
        };
    }
  };

  const statusBadge = getStatusBadge();

  const handleConfirmAction = async () => {
    if (confirmModalState === 'submit') {
      try {
        await handleSaveEvidence({ autoSubmit: true });
        setConfirmModalState(null);
      } catch {
        // error set in hook
      }
    } else if (confirmModalState === 'save') {
      try {
        await handleSaveEvidence({ autoSubmit: false });
        setConfirmModalState(null);
      } catch {
        // error set in hook
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 transition-all hover:border-slate-300">
      {/* 1. Header: Index Number + ShieldCheck + Title & Description */}
      <div className="flex items-start gap-3.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 border border-slate-200/60 shadow-xs">
          {indexNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0 mt-0.5 stroke-[2.2]" />
            <div className="flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                {criterion.title}
              </h4>
              {criterion.description && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {criterion.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Reviewer Feedback Component */}
      {evidence && (
        <EvidenceReviewerFeedback
          status={evidence.status}
          reviewerNote={evidence.reviewerNote}
          reviewedAt={evidence.reviewedAt}
        />
      )}

      {/* 3. Status Bar: TRẠNG THÁI + Nút mở rộng */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 tracking-wider text-[11px] uppercase">
            TRẠNG THÁI:
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bgColor}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
            <span>{statusBadge.label}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0047AB] hover:bg-[#003882] text-white shadow-sm transition active:scale-95 cursor-pointer"
        >
          {isExpanded ? (
            <>
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Ẩn đi</span>
            </>
          ) : evidence ? (
            <>
              <PenLine className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{canEdit ? 'Chỉnh sửa' : 'Xem chi tiết'}</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isReadOnly ? 'Xem chi tiết' : 'Thêm mới'}</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Expanded Editor */}
      {isExpanded && (
        <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Section: Đánh giá */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-800">
              <PenLine className="w-4 h-4 text-slate-700" />
              <span>Đánh giá / Mô tả chi tiết</span>
            </div>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả về quá trình đạt được thành tích hoặc giải thích minh chứng..."
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50 placeholder:text-slate-400 bg-white"
            />
          </div>

          {/* Section: Tệp minh chứng */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-800">
              <Award className="w-4 h-4 text-slate-700" />
              <span>Tệp minh chứng (Giấy khen, chứng nhận, ảnh chụp)</span>
            </div>

            {canEdit && (
              <EvidenceFileUploadZone
                onUpload={handleFileUpload}
                isUploading={isUploading}
                disabled={!canEdit}
              />
            )}

            <EvidenceAttachmentList
              attachments={attachments}
              onDelete={handleDeleteFile}
              canDelete={canEdit}
            />

            {/* Liên kết Drive */}
            <div className="pt-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Hoặc liên kết Google Drive (nếu có)</span>
                </span>
                {driveLink.trim() && (
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Mở link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                disabled={!canEdit}
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* 5. Actions */}
          {!isReadOnly && !isApproved && (
            <div className="flex items-center justify-center sm:justify-end gap-2.5 pt-4 border-t border-slate-100 flex-wrap">
              {canUndo && (
                <button
                  type="button"
                  onClick={handleReopenEvidence}
                  disabled={isSaving || isUploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Mở sửa lại</span>
                </button>
              )}

              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmModalState('save')}
                    disabled={isSaving || isUploading}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lưu nháp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmModalState('submit')}
                    disabled={isSaving || isUploading}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md shadow-blue-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi thẩm định tiêu chí này</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Modal xác nhận */}
      {confirmModalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                    confirmModalState === 'submit'
                      ? 'bg-blue-100 text-blue-700 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {confirmModalState === 'submit' ? (
                    <Send className="w-5 h-5" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmModalState === 'submit'
                    ? 'Gửi thẩm định tiêu chí'
                    : 'Lưu bản nháp minh chứng'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalState(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {confirmModalState === 'submit' ? (
                <>
                  Bạn đang chuẩn bị gửi thẩm định cho tiêu chí{' '}
                  <strong>"{criterion.title}"</strong>. Tiêu chí này sẽ được chuyển riêng sang trạng
                  thái <strong>Chờ xét duyệt</strong> để Mentor/Admin có thể thẩm định trực tiếp
                  (Micro Review) và phản hồi nhận xét sớm cho bạn.
                </>
              ) : (
                <>
                  Bạn đang chuẩn bị lưu bản nháp minh chứng cho tiêu chí{' '}
                  <strong>"{criterion.title}"</strong>. Dữ liệu được lưu an toàn trên hệ thống và
                  bạn có thể tiếp tục chỉnh sửa bất kỳ lúc nào.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalState(null)}
                disabled={isSaving}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl text-white transition shadow-md cursor-pointer disabled:bg-slate-300 ${
                  confirmModalState === 'submit'
                    ? 'bg-[#0047AB] hover:bg-[#003882] shadow-blue-900/20'
                    : 'bg-slate-800 hover:bg-slate-900 shadow-slate-900/20'
                }`}
              >
                {isSaving
                  ? 'Đang xử lý...'
                  : confirmModalState === 'submit'
                  ? 'Đồng ý gửi thẩm định'
                  : 'Đồng ý lưu nháp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
