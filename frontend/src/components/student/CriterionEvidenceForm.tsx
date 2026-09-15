import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Plus,
  Minus,
  PenLine,
  Award,
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
  X,
} from 'lucide-react';
import type {
  StudentCriterionItemResponse,
  StudentEvidenceItemResponse,
} from '../../types/student';
import { studentService } from '../../services/studentService';
import { sanitizeApiError } from '../../services/apiErrorSanitizer';

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
  // Chỉ còn 1 modal xác nhận duy nhất cho thao tác Lưu (không còn Lưu nháp / Lưu và nộp riêng).
  const [confirmModalState, setConfirmModalState] = useState<'save' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const updated = parseData();
    setDescription(updated.description);
    setDriveLink(updated.driveLink);
  }, [evidence]);

  const attachments = parseAttachments();
  const hasEvidenceContent = Boolean(
    (description && description.trim().length > 0) ||
    (driveLink && driveLink.trim().length > 0) ||
    attachments.length > 0
  );

  // Trang thai hien thi: "Chưa nộp" / "Đã lưu" (+ giu ket qua duyet mentor/admin).
  // - Chua co evidence tren server -> "Chưa nộp"
  // - Da co evidence (da Luu) -> "Đã lưu" (hien nut Hoan tac de nop lai)
  // Giu hien thi ket qua duyet cua mentor/admin (Dat / Khong dat / Can bo sung / Da gui duyet)
  // vi do la thong tin review, khong phai nut hanh dong cua the.
  const getStatus = () => {
    const evStatusStr = String(evidence?.status ?? '').toLowerCase();

    if (evidence) {
      if (evStatusStr === 'approved') {
        return {
          label: 'Đạt tiêu chí',
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50 border-emerald-200/60',
        };
      }
      if (evStatusStr === 'rejected') {
        return {
          label: 'Không đạt',
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50 border-rose-200/60',
        };
      }
      if (evStatusStr === 'needsrevision') {
        return {
          label: 'Cần bổ sung',
          dotColor: 'bg-orange-500',
          textColor: 'text-orange-800',
          bgColor: 'bg-orange-50 border-orange-200/60',
        };
      }
      if (evStatusStr === 'submitted') {
        return {
          label: 'Minh chứng đang xét — Đã gửi Mentor/Admin',
          dotColor: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50 border-blue-200/60',
        };
      }
      return {
        label: 'Đã lưu',
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50 border-emerald-200/60',
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

  // Da co evidence (da Luu) -> cho phep Hoan tac de nop lai.
  // Hoan tac o day chi mo lai form voi du lieu da luu (khong tu dong xoa server),
  // user sua xong bam Luu de ghi de; hoac bam Huy de quay ve ban da luu.
  const canUndo = Boolean(evidence);
  // Form chi co Huy / Luu (+ Hoan tac sau khi Luu). Nut nop tong + gui admin
  // nam o cuoi trang StudentEvidenceSubmissionPage.
  const canCancel = hasEvidenceContent || canUndo || isExpanded;

  const handleCancel = () => {
    const original = parseData();
    setDescription(original.description);
    setDriveLink(original.driveLink);
    setFeedbackMessage(null);
    setConfirmModalState(null);
    if (!evidence && !original.description && !original.driveLink) setIsExpanded(false);
  };

  const handleUndo = () => {
    const saved = parseData();
    if (evidence) {
      setDescription(saved.description);
      setDriveLink(saved.driveLink);
      setIsExpanded(true);
      setFeedbackMessage({ type: 'success', text: 'Da mo lai minh chung da luu. Ban hay chinh sua roi bam Luu de nop lai.' });
      return;
    }
    setDescription('');
    setDriveLink('');
    setFeedbackMessage(null);
  };

  // Chi 1 loai confirm: Luu (khong con Luu nhap / Luu va nop rieng tren the).
  const handleOpenConfirm = () => {
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

  // Execute confirmed action (chi Luu; nop tong + gui admin o cuoi trang)
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

      const updated = await studentService.upsertEvidence(
        applicationId,
        criterion.id,
        dataPayload,
        evidence?.rowVersion
      );

      onEvidenceUpdated(updated);
      setConfirmModalState(null);
      setIsExpanded(false);
      setFeedbackMessage({
        type: 'success',
        text: 'Đã lưu minh chứng. Bạn có thể Hoàn tác để nộp lại nếu cần.',
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      const code = getBackendErrorCode(err);
      // RowVersion đã cũ (lưu trùng / tab khác vừa lưu): tải bản mới rồi báo user thử lại.
      if (err?.response?.status === 409 && code === 'concurrency_conflict') {
        await reloadLatestApplication();
        setFeedbackMessage({
          type: 'error',
          text: 'Dữ liệu vừa được cập nhật ở nơi khác. Đã tải bản mới nhất, vui lòng kiểm tra lại rồi lưu.',
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

  // Upload file from device
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isUploading || isSaving) return;

    if (file.size > 10 * 1024 * 1024) {
      setFeedbackMessage({
        type: 'error',
        text: 'Dung lượng tệp vượt quá giới hạn 10 MB.',
      });
      return;
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

      const updated = await studentService.uploadEvidenceFile(currentEvidence.id, file);
      onEvidenceUpdated(updated);
      setFeedbackMessage({
        type: 'success',
        text: `Đã tải lên tệp "${file.name}" thành công!`,
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      const code = getBackendErrorCode(err);
      if (err?.response?.status === 409 && code === 'concurrency_conflict') {
        await reloadLatestApplication();
      }
      const msg = sanitizeApiError(err);
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPdf = (fileName?: string) => fileName?.toLowerCase().endsWith('.pdf');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 transition-all hover:border-slate-300">
      {/* 1. Header Row: Number index circle + ShieldCheck + Criterion Title / Description */}
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

      {/* 2. Mentor Feedback Section (Mockup box with pink avatar, "Mentor", badge "Nhận xét") */}
      {evidence?.reviewerNote && (
        <div className="mt-4 ml-11 sm:ml-12 p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 text-xs">Mentor</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold">
              <Check className="w-3 h-3" />
              <span>Nhận xét</span>
            </span>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-slate-200/60">
            {evidence.reviewerNote}
          </div>
        </div>
      )}

      {/* 3. Status Bar: TRẠNG THÁI + Nút "+ Thêm mới" / "- Ẩn đi" */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 tracking-wider text-[11px] uppercase">
            TRẠNG THÁI:
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.bgColor} ${status.textColor}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
            <span>{status.label}</span>
          </span>
        </div>

        {/* Nút "+ Thêm mới" khi đóng / "- Ẩn đi" khi mở (Theo đúng mockup ảnh) */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          title={evidence ? 'Chỉnh sửa minh chứng đã lưu' : 'Thêm minh chứng mới'}
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
              <span>{isReadOnly ? 'Xem chi tiết' : 'Chỉnh sửa'}</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isReadOnly ? 'Xem chi tiết' : 'Thêm mới'}</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Phần nhập thông tin & nộp minh chứng (Khi mở rộng theo đúng mockup ảnh) */}
      {isExpanded && (
        <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Section: ✎ Đánh giá */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-800">
              <PenLine className="w-4 h-4 text-slate-700" />
              <span>Đánh giá</span>
            </div>
            <textarea
              rows={3}
              disabled={isReadOnly}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Input text"
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50 placeholder:text-slate-400 bg-white"
            />
          </div>

          {/* Section: 🏅 Nộp minh chứng */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-800">
              <Award className="w-4 h-4 text-slate-700" />
              <span>Nộp minh chứng</span>
            </div>

            {/* Drag & Drop Upload Zone (Theo đúng mockup ảnh) */}
            {!isReadOnly && (
              <label className="border-2 border-dashed border-sky-300 hover:border-blue-500 bg-sky-50/15 hover:bg-sky-50/30 rounded-2xl p-7 sm:p-9 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-blue-600 stroke-[1.5] mb-2 transition-colors" />
                <p className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  Drop files here
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supported format: PDF, PNG, JPG
                </p>
                <p className="text-xs font-bold text-slate-400 my-2">
                  OR
                </p>
                <span className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 underline">
                  Browse files
                </span>
                <input
                  type="file"
                  disabled={isUploading || isReadOnly}
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
              </label>
            )}

            {/* Spinner when uploading */}
            {isUploading && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 py-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Đang tải tệp lên hệ thống...</span>
              </div>
            )}

            {/* Danh sách tệp đã tải lên */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tệp minh chứng đã tải ({attachments.length}):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((att: any, idx: number) => {
                    const url = att.url || att.fileUrl || att.secure_url || att;
                    const name = att.fileName || att.name || `Tệp minh chứng ${idx + 1}`;
                    const isPdfFile = isPdf(name);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isPdfFile
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {isPdfFile ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate" title={name}>
                              {name}
                            </p>
                            {att.bytes && (
                              <span className="text-[10px] text-slate-400">
                                {formatFileSize(att.bytes)}
                              </span>
                            )}
                          </div>
                        </div>

                        <a
                          href={typeof url === 'string' ? url : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition"
                          title="Mở xem tệp"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tùy chọn dán Google Drive Link */}
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
                disabled={isReadOnly}
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Feedback message banner */}
          {feedbackMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* 5. Chi 2 nut: Huy + Luu. Sau khi Luu -> them nut Hoan tac de nop lai. */}
          {!isReadOnly && (
            <div className="flex items-center justify-center sm:justify-end gap-3 pt-4 border-t border-slate-100 flex-wrap">
              {/* Huy: reset ve ban da luu (neu co) */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={!canCancel || isSaving || isUploading}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>

              {/* Hoan tac: chi hien sau khi da Luu de nop lai */}
              {canUndo && (
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={isSaving || isUploading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Hoàn tác để nộp lại
                </button>
              )}

              {/* Luu minh chung the nay (nop tong + gui admin o cuoi trang) */}
              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={isSaving || isUploading}
                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0047AB] hover:bg-[#003882] text-white shadow-md shadow-blue-900/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Lưu
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. Pop-up xac nhan Luu duy nhat */}
      {confirmModalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0047AB] flex items-center justify-center font-bold">
                  <Save className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận lưu minh chứng
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
              Bạn đang chuẩn bị lưu minh chứng cho tiêu chí 
              <strong>"{criterion.title}"</strong>. Sau khi lưu, thẻ sẽ hiện nút Hoàn tác để nộp lại nếu cần. 
              Nút nộp tổng + gửi admin/mentor chấm bài nằm ở cuối trang (ấn 1 lần để gửi toàn bộ hồ sơ).
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
                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl text-white bg-[#0047AB] hover:bg-[#003882] transition shadow-md shadow-blue-900/20 cursor-pointer disabled:bg-slate-300"
              >
                {isSaving ? 'Đang xử lý...' : 'Đồng ý lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
