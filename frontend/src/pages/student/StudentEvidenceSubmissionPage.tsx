import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  X,
  Trash2,
} from 'lucide-react';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardFooter } from '../../components/dashboard/DashboardFooter';
import { SystemLauncher } from '../../components/dashboard/SystemLauncher';
import { useWelcomeDashboard } from '../../hooks/dashboard/useWelcomeDashboard';
import { useLauncher } from '../../hooks/dashboard/useLauncher';
import { formatUserRole } from '../../components/dashboard/home/homeDashboardConfig';
import type { User } from '../../types/auth';
import {
  SubmissionStatus,
  type StudentApplicationDetailResponse,
  type StudentEvidenceItemResponse,
} from '../../types/student';
import { studentService } from '../../services/studentService';
import { sanitizeApiError } from '../../services/apiErrorSanitizer';
import { StandardGroupTabs, STANDARD_DEFINITIONS } from '../../components/student/StandardGroupTabs';
import { CriterionEvidenceForm } from '../../components/student/CriterionEvidenceForm';

interface StudentEvidenceSubmissionPageProps {
  user: User;
  onLogout: () => void;
}

export const StudentEvidenceSubmissionPage: React.FC<StudentEvidenceSubmissionPageProps> = ({
  user,
  onLogout,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeGroupCode, setActiveGroupCode] = useState<string>('Ethics');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // System header & launcher
  const {
    displayName,
    avatarUrl,
    notifications,
    features,
  } = useWelcomeDashboard(user);

  const {
    launcherOpen,
    featureSearch,
    filteredFeatures,
    featureGroups,
    launcherButtonRef,
    launcherSearchRef,
    openLauncher,
    closeLauncher,
    toggleLauncher,
    setFeatureSearch,
  } = useLauncher(features);

  // Query: Application Detail
  const {
    data: application,
    isLoading: appLoading,
    error: appError,
  } = useQuery({
    queryKey: ['application-detail', id],
    queryFn: () => studentService.getApplicationDetail(id!),
    enabled: Boolean(id),
  });

  // Query: Campaign Detail (for criteria tree)
  const {
    data: campaign,
    isLoading: campaignLoading,
  } = useQuery({
    queryKey: ['campaign-detail', application?.campaignId],
    queryFn: () => studentService.getCampaignDetail(application!.campaignId),
    enabled: Boolean(application?.campaignId),
  });

  // Submit Application Mutation
  const submitMutation = useMutation({
    mutationFn: () => studentService.submitApplication(application!.id, application!.rowVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      setIsSubmitModalOpen(false);
    },
    onError: (err: any) => {
      const msg = sanitizeApiError(err);
      setActionError(msg);
    },
  });

  // Nhận evidence mới từ CriterionEvidenceForm và cập nhật cache ngay lập tức
  // (tránh stale rowVersion dẫn tới 409 concurrency_conflict ở lần lưu kế tiếp).
  const handleEvidenceUpdated = (updated: StudentEvidenceItemResponse) => {
    if (!id) return;
    queryClient.setQueryData<StudentApplicationDetailResponse>(
      ['application-detail', id],
      (prev) => {
        if (!prev) return prev;
        const idx = prev.evidences.findIndex((e) => e.id === updated.id);
        const nextEvidences =
          idx >= 0
            ? prev.evidences.map((e) => (e.id === updated.id ? updated : e))
            : [...prev.evidences, updated];
        return { ...prev, evidences: nextEvidences };
      },
    );
    void queryClient.invalidateQueries({ queryKey: ['application-detail', id] });
    void queryClient.invalidateQueries({ queryKey: ['my-applications'] });
  };

  if (appLoading || campaignLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Đang tải hồ sơ và tiêu chuẩn minh chứng...</p>
        </div>
      </div>
    );
  }

  if (appError || !application) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Không tìm thấy hồ sơ</h2>
          <p className="text-xs text-slate-500 mt-1">
            Hồ sơ có thể đã bị xóa hoặc bạn không có quyền truy cập hồ sơ này.
          </p>
          <button
            onClick={() => navigate('/dashboard/applications')}
            className="mt-5 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Quay về danh sách hồ sơ
          </button>
        </div>
      </div>
    );
  }

  const allCriteria = campaign?.criteria ?? [];
  const evidences = application.evidences ?? [];

  // Filter criteria for active standard tab
  const activeStandardDef = STANDARD_DEFINITIONS.find(
    (d) => d.groupCode.toLowerCase() === activeGroupCode.toLowerCase()
  );

  const activeStandardIndex = STANDARD_DEFINITIONS.findIndex(
    (d) => d.groupCode.toLowerCase() === activeGroupCode.toLowerCase()
  );

  const activeCriteria = allCriteria.filter((c) => {
    const cg = c.groupCode?.trim().toLowerCase();
    const dg = activeGroupCode.trim().toLowerCase();
    const num = (activeStandardIndex + 1).toString();
    return cg === dg || cg === num;
  });

  const isCriterionOptional = (c: any) => {
    if (!c.isRequired) return true;
    const titleLower = (c.title || '').toLowerCase();
    const codeLower = (c.code || '').toLowerCase();
    if (titleLower.includes('tự chọn') || titleLower.includes('(tự chọn)') || codeLower.includes('tu_chon')) {
      return true;
    }
    return false;
  };

  const requiredCriteria = activeCriteria.filter((c) => !isCriterionOptional(c));
  const optionalCriteria = activeCriteria.filter((c) => isCriterionOptional(c));
  const ActiveStandardIcon = activeStandardDef?.icon || CheckCircle;

  const getCampaignLevelName = () => {
    if (campaign?.level === 2) return 'Cấp Thành phố';
    if (campaign?.level === 3) return 'Cấp Trung ương';
    return 'Cấp Trường';
  };

  // Calculate overall progress
  const totalCriteria = allCriteria.length;
  const filledCriteria = allCriteria.filter((c) => {
    const ev = evidences.find((e) => e.criterionId === c.id);
    return ev && ev.dataJson && ev.dataJson.length > 2;
  }).length;

  // Status flags (Hỗ trợ cả String enum từ backend như "Draft" và Number enum 1)
  const statusStr = String(application.status ?? '').toLowerCase();
  const isDraft = statusStr === 'draft' || application.status === SubmissionStatus.Draft;
  const isNeedsRevision = statusStr === 'needsrevision' || application.status === SubmissionStatus.NeedsRevision;
  const isSubmitted = statusStr === 'submitted' || application.status === SubmissionStatus.Submitted;
  const isUnderReview = statusStr === 'underreview' || application.status === SubmissionStatus.UnderReview;
  const isApproved = statusStr === 'approved' || application.status === SubmissionStatus.Approved;
  const isRejected = statusStr === 'rejected' || application.status === SubmissionStatus.Rejected;
  const isEditable = isDraft || isNeedsRevision;

  // Nut cuoi trang: Luu (dong bo cache) + Nop tong 1 lan gui toan bo ho so cho mentor/admin.
  // Moi the chi co Huy / Luu (+ Hoan tac sau Luu); khong nop rieng tung the nua.
  const handleSaveAndSubmit = () => {
    setActionError(null);
    setIsSubmitModalOpen(true);
  };

  const handleSaveAll = () => {
    setActionError(null);
    queryClient.invalidateQueries({ queryKey: ['application-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    setSuccessNotification(
      `Đã lưu toàn bộ minh chứng tiêu chuẩn "${activeStandardDef?.name || 'hiện tại'}". Bạn chỉ cần ấn Nộp 1 lần ở cuối trang để gửi toàn bộ hồ sơ cho mentor/admin chấm bài.`
    );
    setTimeout(() => setSuccessNotification(null), 4000);
  };

  const handleConfirmClear = async () => {
    if (!application || isClearing) return;
    try {
      setIsClearing(true);
      setActionError(null);
      const activeCriterionIds = new Set(activeCriteria.map((c) => c.id));
      const targetEvidences = evidences.filter((e) => activeCriterionIds.has(e.criterionId));

      if (targetEvidences.length === 0) {
        setSuccessNotification('Tiêu chuẩn này chưa có dữ liệu minh chứng nào để xóa.');
        setIsClearModalOpen(false);
        setTimeout(() => setSuccessNotification(null), 3000);
        return;
      }

      // Chạy tuần tự (không Promise.all) để tránh race rowVersion + quá tải backend.
      for (const ev of targetEvidences) {
        await studentService.upsertEvidence(
          application.id,
          ev.criterionId,
          JSON.stringify({ description: '', driveLink: '' }),
          ev.rowVersion
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['application-detail', id] });
      setIsClearModalOpen(false);
      setSuccessNotification(
        `Đã xóa toàn bộ minh chứng trong tiêu chuẩn "${activeStandardDef?.name || 'hiện tại'}" thành công.`
      );
      setTimeout(() => setSuccessNotification(null), 4000);
    } catch (err: any) {
      const msg = sanitizeApiError(err);
      setActionError(msg);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-['Inter',_sans-serif]">
      <DashboardHeader
        displayName={displayName}
        role={formatUserRole(user.role)}
        avatarUrl={avatarUrl}
        notificationCount={notifications.length}
        launcherOpen={launcherOpen}
        menuButtonRef={launcherButtonRef}
        onToggleLauncher={toggleLauncher}
        onOpenLauncher={openLauncher}
        onLogout={onLogout}
      />

      <SystemLauncher
        open={launcherOpen}
        searchValue={featureSearch}
        featureGroups={featureGroups}
        filteredCount={filteredFeatures.length}
        searchInputRef={launcherSearchRef}
        onSearchChange={setFeatureSearch}
        onClose={closeLauncher}
        onLogout={onLogout}
      />

      {/* Sub Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/dashboard/applications')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách hồ sơ</span>
          </button>

          {/* Status badge & Action buttons */}
          <div className="flex items-center gap-3">
            {/* Overall Status Badge */}
            {isApproved ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Đạt danh hiệu SV5T</span>
              </div>
            ) : isNeedsRevision ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cần bổ sung minh chứng</span>
              </div>
            ) : isSubmitted ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Đã nộp - Chờ duyệt</span>
              </div>
            ) : isUnderReview ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Đang chấm điểm</span>
              </div>
            ) : isRejected ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Không đạt</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Bản nháp</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Hero Banner (Kéo dài cân đối dạng thẻ nổi max-w-7xl, không full-width) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="relative rounded-3xl bg-gradient-to-b from-[#4d56e8] via-[#3a7deb] to-[#4eb7f8] pt-10 sm:pt-12 pb-14 sm:pb-16 px-6 sm:px-12 text-center text-white shadow-xl shadow-blue-500/10 border border-white/25 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto space-y-2 sm:space-y-2.5 z-10">
            <p className="text-xs sm:text-sm font-bold tracking-widest text-blue-100 uppercase">
              HỘI SINH VIÊN TRƯỜNG ĐẠI HỌC HÀ NỘI
            </p>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm uppercase text-white">
              XÉT CHỌN DANH HIỆU
            </h1>

            <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase text-[#FACC15] drop-shadow-sm">
              "SINH VIÊN 5 TỐT"
            </div>

            <div className="inline-block pt-1">
              <span className="px-6 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs sm:text-sm font-bold tracking-wide border border-white/35 text-white shadow-inner">
                NĂM HỌC {application.schoolYear || '2025 - 2026'}
              </span>
            </div>

            {/* Vạch ngang phân cách nhỏ */}
            <div className="w-16 h-0.5 bg-white/35 rounded-full mx-auto mt-3" />
          </div>
        </div>
      </div>

      {/* 5 Standards Tabs (Đẩy lên nổi đè lên chân header banner, loại bỏ 3 cấp độ) */}
      <div className="-mt-6 sm:-mt-7 relative z-20">
        <StandardGroupTabs
          activeGroupCode={activeGroupCode}
          onSelectGroup={setActiveGroupCode}
          criteria={allCriteria}
          evidences={evidences}
        />
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Success Notification if any */}
        {successNotification && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{successNotification}</span>
            </div>
            <button
              onClick={() => setSuccessNotification(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Error if any */}
        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* High priority feedback alert if NeedsRevision */}
        {isNeedsRevision && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-900 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-orange-900">
                  Hồ sơ cần bổ sung / chỉnh sửa minh chứng
                </h3>
                <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                  Hội đồng xét duyệt hoặc Mentor đã gửi phản hồi nhận xét trên các tiêu chí chưa đạt yêu cầu. Bạn vui lòng kiểm tra các ghi chú màu cam ở từng tiêu chuẩn, cập nhật thông tin và bấm <strong>"Nộp hồ sơ chính thức"</strong> để gửi lại bài chấm.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Standard Header Card (Theo đúng mock ảnh) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0047AB] flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
                <ActiveStandardIcon className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                  TIÊU CHUẨN {activeStandardDef?.name.toUpperCase()}
                </h2>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">
                  {getCampaignLevelName()} — Đính kèm minh chứng để xét duyệt
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50/80 text-[#0047AB] text-xs font-bold border border-blue-100/80 self-start sm:self-center">
              <span>Nội dung minh chứng</span>
            </div>
          </div>
        </div>

        {/* 1. BẢNG ĐIỀU KIỆN BẮT BUỘC */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden mb-6">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-blue-100/90 via-sky-50/80 to-blue-50/50 border-b border-blue-200/90 p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-700/25">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-blue-950 uppercase tracking-wide">
                    ĐIỀU KIỆN BẮT BUỘC
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold tracking-wide uppercase">
                    Bắt buộc
                  </span>
                </div>
                <p className="text-xs text-blue-800/90 font-medium mt-0.5">
                  Bạn phải hoàn thành TẤT CẢ mục này ({requiredCriteria.length} tiêu chí)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Hướng dẫn nộp</span>
            </button>
          </div>

          {/* List of required criteria */}
          <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
            {requiredCriteria.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Không có tiêu chí bắt buộc nào trong tiêu chuẩn này.
              </p>
            ) : (
              requiredCriteria.map((criterion, idx) => {
                const ev = evidences.find((e) => e.criterionId === criterion.id);
                return (
                  <CriterionEvidenceForm
                    key={criterion.id}
                    criterion={criterion}
                    evidence={ev}
                    applicationId={application.id}
                    indexNumber={idx + 1}
                    isReadOnly={!isEditable}
                    onEvidenceUpdated={handleEvidenceUpdated}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* 2. BẢNG TIÊU CHÍ TỰ CHỌN */}
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden mb-8">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-amber-100/90 via-orange-50/80 to-amber-50/50 border-b border-amber-200/90 p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-600/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-amber-950 uppercase tracking-wide">
                    TIÊU CHÍ TỰ CHỌN
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold tracking-wide uppercase">
                    Tự chọn
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 font-medium mt-0.5">
                  Hoàn thành theo số lượng quy định của tiêu chuẩn ({optionalCriteria.length} tiêu chí)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Hướng dẫn nộp</span>
            </button>
          </div>

          {/* List of optional criteria */}
          <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
            {optionalCriteria.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Không có tiêu chí tự chọn nào trong tiêu chuẩn này.
              </p>
            ) : (
              optionalCriteria.map((criterion, idx) => {
                const ev = evidences.find((e) => e.criterionId === criterion.id);
                return (
                  <CriterionEvidenceForm
                    key={criterion.id}
                    criterion={criterion}
                    evidence={ev}
                    applicationId={application.id}
                    indexNumber={requiredCriteria.length + idx + 1}
                    isReadOnly={!isEditable}
                    onEvidenceUpdated={handleEvidenceUpdated}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Nut cuoi trang: Luu (dong bo) + Nop 1 lan gui toan bo ho so cho mentor/admin cham bai */}
        <div className="mt-8 mb-10 flex flex-wrap items-center justify-end gap-3.5">
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setIsClearModalOpen(true);
            }}
            disabled={!isEditable || isClearing}
            className="px-6 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-sky-50 text-[#0284c7] border border-[#38bdf8] shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? 'Đang hủy...' : 'Hủy'}
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!isEditable}
            className="px-6 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-sm hover:shadow transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lưu
          </button>

          <button
            type="button"
            onClick={handleSaveAndSubmit}
            disabled={!isEditable || submitMutation.isPending}
            className="px-6 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#38bdf8] hover:bg-[#0ea5e9] text-white shadow-sm hover:shadow transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lưu và gửi
          </button>
        </div>
      </main>

      {/* Submission Guide Modal */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Hướng dẫn nộp minh chứng</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 text-xs text-slate-600 space-y-3 leading-relaxed">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900">
                <p className="font-semibold mb-1">📄 1. Định dạng tệp hỗ trợ:</p>
                <p>Nhận tệp <strong>PDF</strong> hoặc <strong>Hình ảnh</strong> (JPG, PNG, WEBP), dung lượng tối đa <strong>10 MB</strong>/tệp từ máy tính hoặc điện thoại.</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-900">
                <p className="font-semibold mb-1">🔗 2. Liên kết Google Drive:</p>
                <p>Bạn có thể dán đường link thư mục hoặc tệp trên Google Drive. Lưu ý bật quyền <em>"Bất kỳ ai có đường liên kết đều có thể xem"</em>.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-900">
                <p className="font-semibold mb-1">🔄 3. Lưu & Hoàn tác để nộp lại:</p>
                <p>Mỗi thẻ chỉ có <strong>Hủy</strong> và <strong>Lưu</strong>. Sau khi <strong>Lưu</strong> sẽ hiện nút <strong>Hoàn tác để nộp lại</strong> nếu cần sửa. Khi đã đẩy đủ minh chứng, bạn chỉ cần ấn <strong>Nộp và gửi admin chấm bài</strong> 1 lần ở cuối trang để gửi toàn bộ hồ sơ.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0047AB] text-white hover:bg-[#003882] transition cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <DashboardFooter />

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-800">Xác nhận nộp hồ sơ chính thức</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bạn đang gửi hồ sơ <strong>{application.applicationCode}</strong> đến Hội đồng xét duyệt và Mentor. Sau khi nộp, hồ sơ sẽ chuyển sang trạng thái chờ duyệt.
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Tiêu chí đã nộp minh chứng:</span>
                <span className="font-bold text-blue-700">{filledCriteria}/{totalCriteria}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đợt xét:</span>
                <span className="font-semibold text-slate-700">{application.campaignName}</span>
              </div>
            </div>

            {/* Checkbox agreement */}
            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer my-4">
              <input
                type="checkbox"
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Tôi cam kết tất cả thông tin kê khai và tệp minh chứng đính kèm là hoàn toàn trung thực, chính xác và chịu mọi trách nhiệm theo quy định của Đoàn - Hội.
              </span>
            </label>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={!agreementChecked || submitMutation.isPending}
                className={`px-5 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-sm ${agreementChecked && !submitMutation.isPending
                    ? 'bg-[#0052cc] hover:bg-[#0747a6] cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
              >
                {submitMutation.isPending ? 'Đang gửi...' : 'Gửi nộp hồ sơ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Criteria Evidences Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận hủy minh chứng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn hủy và xóa toàn bộ minh chứng đã nhập trong <strong>TIÊU CHUẨN {activeStandardDef?.name.toUpperCase()}</strong>?
              Dữ liệu mô tả và liên kết minh chứng của các tiêu chí trong tiêu chuẩn này sẽ bị đặt lại về rỗng.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={isClearing}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isClearing ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
