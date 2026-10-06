import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Lock, RefreshCw, Unlock } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { EvidenceViewerModal, ApplicationDetailModal } from '../../features/applications';
import {
  useStudentDetailView,
  StudentDetailHero,
  StudentDetailProfileTab,
  StudentDetailApplicationsTab,
  StudentDetailEvidenceTab,
  StudentDetailHistoryTab,
  StudentReviewModal,
  StudentLockDialog,
} from '../../features/students';

export function StudentDetailPage() {
  const {
    student,
    isPending,
    isError,
    refetch,
    tab,
    setTab,
    stats,
    canLock,
    lockOpen,
    setLockOpen,
    toggleLock,
    isLockSubmitting,
    viewingEvidence,
    viewerOpen,
    setViewerOpen,
    handleViewEvidence,
    reviewing,
    setReviewing,
    submitReview,
    isReviewSubmitting,
    selectedAppId,
    setSelectedAppId,
    banner,
  } = useStudentDetailView();

  if (isPending) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="w-full max-w-3xl mx-auto py-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <span className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <AlertCircle size={24} />
          </span>
          <p className="mt-3 text-[15px] font-semibold text-slate-900">Không tải được hồ sơ sinh viên</p>
          <p className="mt-1 text-xs text-slate-500">Đường truyền gián đoạn hoặc hồ sơ đã bị xóa. Vui lòng thử lại.</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              className="btn-compact-outline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
            <Link to="/admin/students" className="btn-compact">
              Về danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const p = student.profile;
  const fullName = p?.fullName || student.displayName || student.email;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-12 animate-fade-in">
      <AdminPageHeader
        title="Hồ sơ sinh viên"
        description="Thông tin tài khoản • hồ sơ học vụ • đơn đăng ký • minh chứng • nhật ký xét duyệt"
        actions={
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/admin/students"
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-sky-200 hover:bg-sky-50/60 hover:text-sky-700 transition-[background-color,border-color,color]"
            >
              Danh sách
            </Link>
            {canLock && !student.isDeleted && (
              <button
                type="button"
                onClick={() => setLockOpen(true)}
                className={`h-9 px-4 inline-flex items-center gap-1.5 rounded-xl text-[13px] font-semibold text-white cursor-pointer transition-[background-color,box-shadow] active:scale-[0.98] shadow-[0_8px_18px_-8px_rgba(220,38,38,0.6)] ${
                  student.isActive
                    ? 'bg-gradient-to-b from-[#ef4444] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c]'
                    : 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 !shadow-[0_8px_18px_-8px_rgba(16,185,129,0.6)]'
                }`}
              >
                {student.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                {student.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
            )}
          </div>
        }
      />

      {banner && (
        <div
          className={`px-3.5 py-2.5 rounded-2xl border text-[13px] font-medium flex items-center gap-2 ${
            banner.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}
        >
          <CheckCircle2 size={15} className="shrink-0" />
          {banner.msg}
        </div>
      )}

      <StudentDetailHero
        student={student}
        stats={stats}
        activeTab={tab}
        onTabChange={setTab}
      />

      {tab === 'profile' && <StudentDetailProfileTab student={student} />}

      {tab === 'applications' && (
        <StudentDetailApplicationsTab
          applications={student.applications}
          onSelectApplication={setSelectedAppId}
        />
      )}

      {tab === 'evidence' && (
        <StudentDetailEvidenceTab
          evidenceGroups={student.evidenceGroups}
          onViewEvidence={handleViewEvidence}
          onReviewEvidence={setReviewing}
        />
      )}

      {tab === 'history' && <StudentDetailHistoryTab student={student} />}

      <StudentReviewModal
        isOpen={Boolean(reviewing)}
        evidence={reviewing}
        isLoading={isReviewSubmitting}
        onClose={() => setReviewing(null)}
        onSubmit={submitReview}
      />

      <StudentLockDialog
        isOpen={lockOpen}
        isLoading={isLockSubmitting}
        onClose={() => setLockOpen(false)}
        onConfirm={toggleLock}
        student={{
          id: student.id,
          fullName,
          email: student.email,
          studentCode: p?.studentCode ?? '',
          isActive: student.isActive,
        }}
      />

      <EvidenceViewerModal
        isOpen={viewerOpen}
        evidence={viewingEvidence}
        onClose={() => setViewerOpen(false)}
      />

      <ApplicationDetailModal
        isOpen={Boolean(selectedAppId)}
        applicationId={selectedAppId}
        onClose={() => setSelectedAppId(null)}
        onSuccessDecision={() => {
          void refetch();
        }}
      />
    </div>
  );
}

export default StudentDetailPage;