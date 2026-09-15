import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardFooter } from '../../components/dashboard/DashboardFooter';
import { SystemLauncher } from '../../components/dashboard/SystemLauncher';
import { useWelcomeDashboard } from '../../hooks/dashboard/useWelcomeDashboard';
import { useLauncher } from '../../hooks/dashboard/useLauncher';
import { formatUserRole } from '../../components/dashboard/home/homeDashboardConfig';
import type { User } from '../../types/auth';
import { SubmissionStatus, type StudentApplicationSummaryResponse } from '../../types/student';
import { studentService } from '../../services/studentService';
import { sanitizeApiError } from '../../services/apiErrorSanitizer';
import { MyApplicationCards } from '../../components/student/MyApplicationCards';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  FilePlus2,
  X,
  MessageSquareText,
  FileEdit,
  ArrowRight,
} from 'lucide-react';

interface StudentMyApplicationsPageProps {
  user: User;
  onLogout: () => void;
}

export const StudentMyApplicationsPage: React.FC<StudentMyApplicationsPageProps> = ({
  user,
  onLogout,
}) => {
  const queryClient = useQueryClient();

  const [withdrawModalApp, setWithdrawModalApp] = useState<StudentApplicationSummaryResponse | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // System header & launcher hooks
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

  // Query: Get My Applications
  const {
    data: myApplicationsData,
    isLoading: myApplicationsLoading,
  } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => studentService.getMyApplications({ pageSize: 50 }),
  });

  const allApplications = myApplicationsData?.items ?? [];
  const submittedApplications = allApplications.filter((a) => a.status !== SubmissionStatus.Draft);
  const draftApplications = allApplications.filter((a) => a.status === SubmissionStatus.Draft);

  // Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: async ({ appId, reason }: { appId: string; reason: string }) => {
      const detail = await studentService.getApplicationDetail(appId);
      return studentService.withdrawApplication(appId, detail.rowVersion, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      setWithdrawModalApp(null);
      setWithdrawReason('');
    },
    onError: (err: any) => {
      const msg = sanitizeApiError(err);
      setActionError(msg);
    },
  });

  const handleConfirmWithdraw = () => {
    if (!withdrawModalApp) return;
    setActionError(null);
    withdrawMutation.mutate({
      appId: withdrawModalApp.id,
      reason: withdrawReason,
    });
  };

  // Stats calculation: Chỉ tính trên các hồ sơ ĐÃ NỘP cho Mentor
  const totalApps = submittedApplications.length;
  const pendingApps = submittedApplications.filter(
    (a) => a.status === SubmissionStatus.Submitted || a.status === SubmissionStatus.UnderReview
  ).length;
  const revisionApps = submittedApplications.filter((a) => a.status === SubmissionStatus.NeedsRevision).length;
  const approvedApps = submittedApplications.filter((a) => a.status === SubmissionStatus.Approved).length;
  const totalEvidencesAll = submittedApplications.reduce((s, a) => s + (a.totalEvidences ?? 0), 0);
  const approvedEvidencesAll = submittedApplications.reduce((s, a) => s + (a.approvedEvidences ?? 0), 0);
  const pendingEvidencesAll = submittedApplications.reduce((s, a) => s + (a.pendingEvidences ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif]">
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">
              Quản lý hồ sơ cá nhân
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              Hồ sơ đã nộp & Phản hồi Mentor
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi tiến độ chấm điểm, quản lý hồ sơ và xem các nhận xét góp ý từ Hội đồng xét duyệt
            </p>
          </div>

          <Link
            to="/dashboard/campaigns"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-sm transition-all active:scale-95 cursor-pointer self-start sm:self-center shrink-0"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Nộp hồ sơ chiến dịch mới</span>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tổng số hồ sơ</span>
              <FileCheck2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-slate-900 mt-2 block">{totalApps}</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Đang chờ thẩm định</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-2xl font-black text-purple-600 mt-2 block">{pendingApps}</span>
            <span className="text-[11px] font-semibold text-purple-500 mt-0.5 block">{pendingEvidencesAll} Minh chứng đang xét</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cần bổ sung (Feedback)</span>
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-2xl font-black text-orange-600 mt-2 block">{revisionApps}</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Đạt danh hiệu SV5T</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-emerald-600 mt-2 block">{approvedApps}</span>
          </div>
        </div>

        {/* Banner tong Minh chung dang xet */}
        {pendingEvidencesAll > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50/90 border border-blue-200 text-blue-950 shadow-xs flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-blue-900">Minh chứng đang xét: </span>
              <span>
                Bạn có <strong>{pendingEvidencesAll}</strong> minh chứng đang chờ Mentor/Admin xét duyệt
                trên <strong>{pendingApps}</strong> hồ sơ (tổng {totalEvidencesAll} minh chứng, đã duyệt{' '}
                <strong>{approvedEvidencesAll}</strong>). Bấm <strong>+ Truy cập</strong> vào hồ sơ để xem
                chi tiết từng tiêu chí.
              </span>
            </div>
          </div>
        )}

        {/* Prominent revision banner if mentor gave feedback */}
        {revisionApps > 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 shadow-sm flex items-start gap-3">
            <MessageSquareText className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-orange-900">
                Bạn có {revisionApps} hồ sơ cần cập nhật lại theo yêu cầu của Mentor!
              </h3>
              <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                Hội đồng xét duyệt đã để lại nhận xét (feedback) hướng dẫn bổ sung minh chứng. Vui lòng bấm vào nút <strong>"+ Truy cập"</strong> ở hồ sơ tương ứng để đọc nhận xét và bổ sung minh chứng.
              </p>
            </div>
          </div>
        )}

        {/* Action Error if any */}
        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Notice for In-Progress Draft Applications */}
        {draftApplications.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FileEdit className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-amber-900">Lưu ý quan trọng: </span>
                <span>
                  Bạn đang có <strong>{draftApplications.length}</strong> hồ sơ nháp đang làm dở (chưa nộp). Các bản nháp này được quản lý và hoàn thiện tại trang <strong>Chiến dịch</strong>.
                </span>
              </div>
            </div>
            <Link
              to="/dashboard/campaigns"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs self-start sm:self-center"
            >
              <span>Xem hồ sơ đang làm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Cards list of submitted applications */}
        <MyApplicationCards
          applications={submittedApplications}
          onWithdraw={(app) => setWithdrawModalApp(app)}
          isLoading={myApplicationsLoading}
        />
      </main>

      <DashboardFooter />

      {/* Withdraw Modal */}
      {withdrawModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-800">Xác nhận rút hồ sơ</h3>
            <p className="text-xs text-slate-500 mt-1">
              Bạn có chắc chắn muốn rút hồ sơ <strong>{withdrawModalApp.applicationCode}</strong>? Hồ sơ sẽ được chuyển về trạng thái rút để bạn có thể chỉnh sửa lại.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do rút hồ sơ (không bắt buộc):
              </label>
              <textarea
                rows={3}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Nhập lý do cần rút lại hồ sơ..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setWithdrawModalApp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmWithdraw}
                disabled={withdrawMutation.isPending}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                {withdrawMutation.isPending ? 'Đang xử lý...' : 'Xác nhận rút'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
