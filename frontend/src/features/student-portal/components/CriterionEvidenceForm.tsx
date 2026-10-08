import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Minus,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Link2,
  CheckCircle2,
  AlertCircle,
  User,
  Check,
  Save,
  RotateCcw,
  Send,
  X,
  Ribbon,
  Loader2,
} from 'lucide-react';
import type {
  StudentCriterionItemResponse,
  StudentEvidenceItemResponse,
} from '../types/student-portal.types';
import { studentPortalService as studentService } from '../services/student-portal.service';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';

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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Parse dataJson (tương thích ngược với payload cũ có isCompleted/isDraft nhưng không dùng nữa).
  const parseData = () => {
    if (!evidence?.dataJson) return { description: '', driveLink: '' };
    try {
      const parsed = JSON.parse(evidence.dataJson);
      return {
        description: parsed.description || parsed.notes || '',
        driveLink: parsed.driveLink || parsed.link || parsed.url || '',
      };
    } catch {
      return { description: evidence.dataJson, driveLink: '' };
    }
  };

  // Parse attachmentsJson
  const parseAttachments = () => {
    if (!evidence?.attachmentsJson) return [];
    try {
      const parsed = JSON.parse(evidence.attachmentsJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  };

  const initialData = parseData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState(initialData.description);
  const [driveLink, setDriveLink] = useState(initialData.driveLink);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Chỉ còn 1 modal xác nhận duy nhất cho thao tác Lưu (không còn Lưu nháp / Lưu và nộp riêng).
  const [confirmModalState, setConfirmModalState] = useState<'save' | 'submit' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const updated = parseData();
    setDescription(updated.description);
    setDriveLink(updated.driveLink);
  }, [evidence]);

  const attachments = parseAttachments();
  const evidenceStatus = String(evidence?.status ?? '').toLowerCase();
  const isSubmittedEvidence = evidenceStatus === 'submitted' || evidenceStatus === '2';
  const isApprovedEvidence = evidenceStatus === 'approved' || evidenceStatus === '3';
  const canEdit = !isReadOnly && !isSubmittedEvidence && !isApprovedEvidence;
  const canReopen = !isReadOnly && isSubmittedEvidence;
  const hasEvidenceContent = Boolean(
    (description && description.trim().length > 0) ||
    (driveLink && driveLink.trim().length > 0) ||
    attachments.length > 0
  );

  // Trang thai hien thi: "Chưa nộp" / "Đã lưu" (+ giu ket qua duyet mentor/admin).
  const getStatus = () => {
    const evStatusStr = String(evidence?.status ?? '').toLowerCase();

    if (evidence) {
      if (evStatusStr === 'approved' || evStatusStr === '3') {
        return {
          label: 'Đạt tiêu chí',
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50 border-emerald-200/60',
        };
      }
      if (evStatusStr === 'rejected' || evStatusStr === '4') {
        return {
          label: 'Không đạt',
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50 border-rose-200/60',
        };
      }
      if (evStatusStr === 'needsrevision' || evStatusStr === '5') {
        return {
          label: 'Cần bổ sung',
          dotColor: 'bg-orange-500',
          textColor: 'text-orange-800',
          bgColor: 'bg-orange-50 border-orange-200/60',
        };
      }
      if (evStatusStr === 'submitted' || evStatusStr === '2') {
        return {
          label: 'Minh chứng đang xét — Đã gửi Mentor/Admin',
          dotColor: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50 border-blue-200/60',
        };
      }
      return {
        label: 'Đã lưu nháp',
        dotColor: 'bg-slate-500',
        textColor: 'text-slate-700',
        bgColor: 'bg-slate-50 border-slate-200/60',
      };
    }

    if (hasEvidenceContent) {
      return {
        label: 'Chưa nộp',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50 border-amber-200/60',
      };
    }

    return {
      label: 'Chưa nộp',
      dotColor: 'bg-slate-400',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50 border-slate-200/60',
    };
  };

  const status = getStatus();

  // Da co evidence (da Luu hoac da Nop) -> cho phep mo sua lai
  const canUndo = canReopen;
  const canCancel = hasEvidenceContent || canUndo || isExpanded;

  const handleCancel = () => {
    const original = parseData();
    setDescription(original.description);
    setDriveLink(original.driveLink);
    setFeedbackMessage(null);
    setConfirmModalState(null);
    if (!evidence && !original.description && !original.driveLink) setIsExpanded(false);
  };

  const handleUndo = async () => {
    const saved = parseData();
    if (evidence && canReopen) {
      try {
        setIsSaving(true);
        const updated = await studentService.reopenEvidence(evidence.id, evidence.rowVersion);
        onEvidenceUpdated(updated);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409) await reloadLatestApplication();
        setFeedbackMessage({ type: 'error', text: sanitizeApiError(err) });
        return;
      } finally {
        setIsSaving(false);
      }
      setDescription(saved.description);
      setDriveLink(saved.driveLink);
      setIsExpanded(true);
      setFeedbackMessage({ type: 'success', text: 'Đã mở lại minh chứng. Bạn có thể chỉnh sửa rồi Lưu nháp hoặc Gửi thẩm định lại.' });
      return;
    }
    setDescription('');
    setDriveLink('');
    setFeedbackMessage(null);
  };

  const handleOpenSaveConfirm = () => {
    if (!description.trim() && !driveLink.trim() && attachments.length === 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'Vui lòng nhập phần đánh giá hoặc tải lên tệp minh chứng trước khi lưu.',
      });
      return;
    }
    if (!isExpanded) setIsExpanded(true);
    setFeedbackMessage(null);
    setConfirmModalState('save');
  };

  const handleOpenSubmitConfirm = () => {
    if (!description.trim() && !driveLink.trim() && attachments.length === 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'Vui lòng nhập phần đánh giá hoặc tải lên tệp minh chứng trước khi gửi thẩm định.',
      });
      return;
    }
    if (!isExpanded) setIsExpanded(true);
    setFeedbackMessage(null);
    setConfirmModalState('submit');
  };

  // Chuẩn hoá mã lỗi backend từ response (code || detail-safe fallback).
  const getBackendErrorCode = (err: unknown): string | undefined => {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { code?: unknown } | undefined;
      return typeof data?.code === 'string' ? data.code : undefined;
    }
    return undefined;
  };

  // Tải lại bản mới nhất của hồ sơ sau khi gặp 409 concurrency để tránh stale rowVersion.
  const reloadLatestApplication = async () => {
    await queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
  };

  // Execute confirmed action (Luu nháp hoặc Gửi thẩm định riêng tiêu chí)
  const handleExecuteConfirmedAction = async () => {
    if (!confirmModalState || isSaving || isUploading) return;

    try {
      setIsSaving(true);
      setFeedbackMessage(null);

      const dataPayload = JSON.stringify({
        description: description.trim(),
        driveLink: driveLink.trim(),
        link: driveLink.trim(),
        updatedAt: new Date().toISOString(),
      });

      // 1. Luôn lưu dữ liệu mới nhất
      const updated = await studentService.upsertEvidence(
        applicationId,
        criterion.id,
        dataPayload,
        evidence?.rowVersion
      );

      if (confirmModalState === 'save') {
        onEvidenceUpdated(updated);
        setConfirmModalState(null);
        setIsExpanded(false);
        setFeedbackMessage({
          type: 'success',
          text: 'Đã lưu bản nháp minh chứng thành công.',
        });
        setTimeout(() => setFeedbackMessage(null), 3000);
      } else if (confirmModalState === 'submit') {
        // 2. Nộp riêng tiêu chí cho Mentor thẩm định
        const submitted = await studentService.submitEvidence(
          updated.id,
          updated.rowVersion
        );
        onEvidenceUpdated(submitted);
        setConfirmModalState(null);
        setIsExpanded(false);
        setFeedbackMessage({
          type: 'success',
          text: 'Đã gửi minh chứng tiêu chí này cho Mentor/Admin thẩm định thành công!',
        });
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    } catch (err: any) {
      const code = getBackendErrorCode(err);
      // RowVersion đã cũ (lưu trùng / tab khác vừa lưu): tải bản mới rồi báo user thử lại.
      if (err?.response?.status === 409 && code === 'concurrency_conflict') {
        await reloadLatestApplication();
        setFeedbackMessage({
          type: 'error',
          text: 'Dữ liệu vừa được cập nhật ở nơi khác. Đã tải bản mới nhất, vui lòng kiểm tra lại.',
        });
        setConfirmModalState(null);
      } else if (
        err?.response?.status === 409 &&
        (code === 'evidence_not_editable' || code === 'application_not_editable')
      ) {
        // Minh chứng / hồ sơ không còn cho sửa (đã nộp/duyệt): đồng bộ lại để UI chuyển read-only.
        await reloadLatestApplication();
        setFeedbackMessage({ type: 'error', text: sanitizeApiError(err) });
        setConfirmModalState(null);
      } else {
        setFeedbackMessage({ type: 'error', text: sanitizeApiError(err) });
        setConfirmModalState(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Size formatting helper
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Process files (from file dialog or drag-and-drop)
  const processSelectedFiles = async (files: File[]) => {
    if (!files.length || isUploading || isSaving || !canEdit) return;

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        setFeedbackMessage({
          type: 'error',
          text: `Tệp "${file.name}" không đúng định dạng. Chỉ hỗ trợ PDF, PNG, JPG.`,
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFeedbackMessage({
          type: 'error',
          text: `Tệp "${file.name}" vượt quá giới hạn 10 MB.`,
        });
        return;
      }
    }

    try {
      setIsUploading(true);
      setFeedbackMessage(null);

      let currentEvidence = evidence;
      if (!currentEvidence) {
        const initialPayload = JSON.stringify({
          description: description.trim() || 'Minh chứng tệp đính kèm',
          driveLink: driveLink.trim(),
        });
        currentEvidence = await studentService.upsertEvidence(
          applicationId,
          criterion.id,
          initialPayload
        );
        onEvidenceUpdated(currentEvidence);
      }

      let lastUpdated = currentEvidence;
      for (const file of files) {
        lastUpdated = await studentService.uploadEvidenceFile(lastUpdated.id, file);
        onEvidenceUpdated(lastUpdated);
      }

      setFeedbackMessage({
        type: 'success',
        text: 'Đã tải tệp minh chứng lên thành công.',
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: sanitizeApiError(err),
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Upload file from file input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processSelectedFiles(Array.from(files));
    }
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canEdit || isUploading || isSaving) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!canEdit || isUploading || isSaving) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processSelectedFiles(Array.from(files));
    }
  };

  // Delete attachment
  const handleDeleteAttachment = async (fileIndex: number) => {
    if (!evidence || isSaving || isUploading || !canEdit) return;

    try {
      setIsSaving(true);
      setFeedbackMessage(null);
      const updated = await studentService.deleteEvidenceFile(evidence.id, fileIndex, evidence.rowVersion);
      onEvidenceUpdated(updated);
      setFeedbackMessage({
        type: 'success',
        text: 'Đã xóa tệp minh chứng.',
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      const code = getBackendErrorCode(err);
      if (err?.response?.status === 409 && code === 'concurrency_conflict') {
        await reloadLatestApplication();
        setFeedbackMessage({
          type: 'error',
          text: 'Dữ liệu vừa được cập nhật ở nơi khác. Đã tải bản mới nhất, vui lòng thử lại.',
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: sanitizeApiError(err),
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isOptional = !criterion.isRequired;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-xs ${
        isExpanded ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200/90'
      }`}
    >
      {/* Accordion Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none bg-white hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
          {/* Index Pill */}
          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            {indexNumber}
          </span>

          {/* Title & Metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                {criterion.title}
              </h4>
              {isOptional ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                  Tự chọn
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                  Bắt buộc
                </span>
              )}
            </div>

            {/* Quick Preview when collapsed */}
            {!isExpanded && (
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-normal">
                {description && (
                  <span className="truncate max-w-xs sm:max-w-md">
                    📝 {description}
                  </span>
                )}
                {attachments.length > 0 && (
                  <span className="text-blue-600 font-medium">
                    📎 {attachments.length} tệp đính kèm
                  </span>
                )}
                {driveLink && (
                  <span className="text-emerald-600 font-medium truncate max-w-xs">
                    🔗 Drive link
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Status Badge + Expand Icon */}
        <div className="flex items-center gap-2.5 shrink-0 mt-0.5 sm:mt-0">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${status.bgColor} ${status.textColor}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
            <span>{status.label}</span>
          </div>

          <button
            type="button"
            className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
            aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Accordion Expanded Body */}
      {isExpanded && (
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/30 space-y-5">
          {/* Criterion Description / Standard Guidelines */}
          {criterion.description && (
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/80 text-xs text-blue-900 leading-relaxed space-y-1">
              <span className="font-bold text-[11px] uppercase tracking-wider text-blue-700 block">
                Yêu cầu chi tiết tiêu chí:
              </span>
              <p className="whitespace-pre-line text-slate-700">{criterion.description}</p>
            </div>
          )}

          {/* Mentor/Admin Evaluation Note (Nếu đã chấm) */}
          {evidence?.reviewerNote && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/60 border border-amber-200 text-xs text-amber-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[11px] text-amber-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Đánh giá từ Người chấm ({evidence.reviewerName || 'Cán bộ xét duyệt'}):
                </span>
                {evidence.score !== null && evidence.score !== undefined && (
                  <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                    Điểm: {evidence.score}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed pl-5 font-normal">
                {evidence.reviewerNote}
              </p>
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-4">
            {/* Description Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tự đánh giá & Nội dung minh chứng
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                placeholder="Ghi chú rõ thành tích, kết quả, ngày tham gia hoặc giải thích chi tiết minh chứng của bạn..."
                rows={3}
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 resize-y leading-relaxed shadow-2xs"
              />
            </div>

            {/* Section Header: Nộp minh chứng */}
            <div className="flex items-center gap-2 pt-1">
              <Ribbon className="w-4 h-4 text-slate-800 stroke-[2.2]" />
              <h5 className="text-sm font-bold text-slate-800">Nộp minh chứng</h5>
            </div>

            {/* Drop files here upload box */}
            <div
              onClick={() => {
                if (canEdit && !isUploading && !isSaving) {
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl py-8 sm:py-10 px-4 flex flex-col items-center justify-center text-center transition-all select-none ${
                !canEdit
                  ? 'border-slate-200 bg-slate-50/50 cursor-not-allowed opacity-70'
                  : isDragging
                  ? 'border-sky-500 bg-sky-50/60 ring-4 ring-sky-100 cursor-copy scale-[1.002]'
                  : isUploading
                  ? 'border-sky-300 bg-sky-50/30 cursor-wait'
                  : 'border-sky-300 hover:border-sky-400 bg-white hover:bg-sky-50/15 cursor-pointer shadow-2xs'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                disabled={!canEdit || isUploading || isSaving}
                className="hidden"
              />

              {isUploading ? (
                <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-2" />
              ) : (
                <UploadCloud className="w-10 h-10 text-slate-400 stroke-[1.5] mb-2" />
              )}

              <p className="text-sm font-bold text-slate-800">
                {isUploading ? 'Đang tải tệp lên...' : 'Drop files here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported format: PDF, PNG, JPG
              </p>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider my-1.5">
                OR
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (canEdit && !isUploading && !isSaving) {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={!canEdit || isUploading || isSaving}
                className="text-xs sm:text-sm font-semibold text-blue-600 underline hover:text-blue-700 cursor-pointer"
              >
                Browse files
              </button>
            </div>

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-4">
                <h6 className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
                  TỆP MINH CHỨNG ĐÃ TẢI ({attachments.length}):
                </h6>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {attachments.map((att: any, idx: number) => {
                    const fileName = att.fileName || att.name || `Tệp minh chứng ${idx + 1}`;
                    const fileUrl = att.fileUrl || att.url || att.secure_url;
                    const isPdf =
                      fileName.toLowerCase().endsWith('.pdf') ||
                      fileUrl?.toLowerCase().includes('.pdf');
                    const sizeLabel = formatFileSize(att.bytes);

                    return (
                      <div
                        key={idx}
                        className="p-2.5 sm:p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 hover:border-slate-300 flex items-center justify-between gap-3 shadow-2xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                            {isPdf ? (
                              <FileText className="w-4 h-4 text-rose-500" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-xs sm:text-sm font-semibold text-slate-800 truncate"
                              title={fileName}
                            >
                              {fileName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-normal">
                              {sizeLabel}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {fileUrl && (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Mở tệp xem"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(idx)}
                              disabled={isSaving}
                              className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Xóa tệp minh chứng"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Google Drive Link Section */}
            <div className="space-y-1.5 mt-4">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Hoặc liên kết Google Drive (nếu có)</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 transition-all pr-9"
                />
                {driveLink && (
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Mở liên kết"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Feedback messages (Success/Error banner) */}
            {feedbackMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border mt-3 transition-all ${
                  feedbackMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedbackMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-medium">{feedbackMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              {isSubmittedEvidence && (
                <span className="text-blue-700 font-medium">
                  Minh chứng đang xét. Bạn có thể bấm Hoàn tác để sửa lại nếu cần.
                </span>
              )}
              {isApprovedEvidence && (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Tiêu chí đã được thẩm định đạt.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {/* Nút Hoàn tác để mở lại tiêu chí đã nộp (reopen) */}
              {canUndo && (
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Hoàn tác để sửa lại</span>
                </button>
              )}

              {/* Nút Hủy */}
              {canCancel && canEdit && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
              )}

              {/* Nút Lưu nháp */}
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenSaveConfirm}
                  disabled={isSaving || isUploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu nháp'}</span>
                </button>
              )}

              {/* Nút Gửi thẩm định tiêu chí này */}
              {canEdit && (
                <button
                  type="button"
                  onClick={handleOpenSubmitConfirm}
                  disabled={isSaving || isUploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5 text-white -rotate-12" />
                  <span>{isSaving ? 'Đang gửi...' : 'Gửi thẩm định tiêu chí này'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Lưu nháp / Gửi thẩm định riêng) */}
      {confirmModalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  confirmModalState === 'submit'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {confirmModalState === 'submit' ? <Send className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmModalState === 'submit' ? 'Xác nhận gửi thẩm định tiêu chí' : 'Xác nhận lưu bản nháp'}
                </h3>
                <span className="text-xs text-slate-500">Tiêu chí {indexNumber}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {confirmModalState === 'submit' ? (
                <>
                  Bạn đang chuẩn bị gửi riêng minh chứng tiêu chí <strong>"{criterion.title}"</strong> cho Hội đồng / Mentor thẩm định sớm. 
                  Sau khi gửi, tiêu chí sẽ chuyển sang trạng thái <em>"Minh chứng đang xét"</em>.
                </>
              ) : (
                <>
                  Bạn đang chuẩn bị lưu bản nháp minh chứng cho tiêu chí <strong>"{criterion.title}"</strong>. 
                  Dữ liệu được lưu an toàn trên hệ thống và bạn có thể tiếp tục chỉnh sửa hoặc gửi thẩm định bất kỳ lúc nào.
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
                onClick={handleExecuteConfirmedAction}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl text-white transition shadow-md cursor-pointer disabled:bg-slate-300 ${
                  confirmModalState === 'submit'
                    ? 'bg-[#0047AB] hover:bg-[#003882] shadow-blue-900/20'
                    : 'bg-slate-800 hover:bg-slate-900 shadow-slate-900/20'
                }`}
              >
                {isSaving ? 'Đang xử lý...' : confirmModalState === 'submit' ? 'Đồng ý gửi thẩm định' : 'Đồng ý lưu nháp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
