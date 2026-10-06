import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Award,
  FileCheck,
  Loader2,
  User,
} from 'lucide-react';
import {
  useApplicationDetail,
  useApplicationEvidences,
  useApplicationReviewMutations,
} from '../hooks/useApplications';
import { studentService } from '../../students/services/student.service';
import type {
  AdminEvidenceItem,
  ApplicantSnapshot,
  StandardProgress,
} from '../types/application.types';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { EvidenceReviewQuickModal } from './EvidenceReviewQuickModal';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import {
  ApplicationDetailHeader,
  ApplicationProgressPanel,
  ApplicationDetailCriteriaTab,
  ApplicationDetailStudentTab,
  ApplicationDetailDecisionTab,
  ApplicationDetailFooter,
} from './detail';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  applicationId: string | null;
  onClose: () => void;
  onSuccessDecision?: () => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  applicationId,
  onClose,
  onSuccessDecision,
}) => {
  const [activeTab, setActiveTab] = useState<'evidences' | 'student' | 'decision'>('evidences');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [toastBanner, setToastBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingEvidence, setViewingEvidence] = useState<AdminEvidenceItem | null>(null);
  const [viewingAttachmentIndex, setViewingAttachmentIndex] = useState(0);

  // Quick evidence review state
  const [quickReviewTarget, setQuickReviewTarget] = useState<AdminEvidenceItem | null>(null);

  // Decision Form State
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'NeedsRevision'>('Approved');
  const [decisionNote, setDecisionNote] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  // Queries & Mutations
  const {
    data: application,
    isLoading: appLoading,
    isError: appError,
    refetch: refetchApp,
  } = useApplicationDetail(applicationId ?? undefined);

  const {
    data: evidencesData,
    isLoading: evLoading,
    isError: evError,
    error: evidenceError,
    refetch: refetchEvs,
  } = useApplicationEvidences(applicationId ?? undefined);

  const { reviewEvidence, decideApplication } = useApplicationReviewMutations();

  // Snapshot parser
  const snapshot: ApplicantSnapshot = useMemo(() => {
    if (!application?.applicantSnapshotJson) return {};
    try {
      return JSON.parse(application.applicantSnapshotJson) as ApplicantSnapshot;
    } catch {
      return {};
    }
  }, [application?.applicantSnapshotJson]);

  // Fetch full student profile to get avatarUrl if not in snapshot
  const { data: studentDetail } = useQuery({
    queryKey: ['admin-student-avatar', snapshot.userId],
    queryFn: () => (snapshot.userId ? studentService.getById(snapshot.userId) : null),
    enabled: Boolean(snapshot.userId && isOpen),
    staleTime: 5 * 60 * 1000,
  });

  const avatarUrl = snapshot.avatarUrl || studentDetail?.avatarUrl || null;

  const evidences = evidencesData?.items ?? [];
  const standards: StandardProgress[] = application?.standards ?? [];
  const completedStandardsCount = standards.filter((s) => s.complete).length;
  const isEligibleForApproval = completedStandardsCount === 5;

  // Filtered Evidences
  const filteredEvidences = useMemo(() => {
    if (selectedGroupFilter === 'all') return evidences;
    return evidences.filter((e) =>
      e.groupCode?.toLowerCase() === selectedGroupFilter.toLowerCase()
    );
  }, [evidences, selectedGroupFilter]);

  const allExpanded =
    filteredEvidences.length > 0 &&
    filteredEvidences.every((ev) => expandedIds[ev.id]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAll = () => {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      filteredEvidences.forEach((ev) => {
        next[ev.id] = true;
      });
      setExpandedIds(next);
    }
  };

  const handleOpenViewer = (ev: AdminEvidenceItem, attIndex = 0) => {
    setViewingEvidence(ev);
    setViewingAttachmentIndex(attIndex);
    setViewerOpen(true);
  };

  // Direct Approve from evaluation row
  const handleDirectApprove = async (item: AdminEvidenceItem) => {
    try {
      await reviewEvidence.mutateAsync({
        id: item.id,
        body: {
          decision: 'Approved',
          note: 'Minh chứng hợp lệ, đã xác nhận đạt tiêu chí.',
          rowVersion: item.rowVersion,
        },
      });
      setToastBanner({
        type: 'success',
        message: `Đã duyệt đạt tiêu chí "${item.criterionTitle}"!`,
      });
      setTimeout(() => setToastBanner(null), 3500);
      await Promise.all([refetchApp(), refetchEvs()]);
    } catch (err: unknown) {
      setToastBanner({ type: 'error', message: sanitizeApiError(err) });
    }
  };

  // Direct Revert back to Submitted
  const handleDirectRevert = async (item: AdminEvidenceItem) => {
    try {
      await reviewEvidence.mutateAsync({
        id: item.id,
        body: {
          decision: 'Submitted',
          note: null,
          rowVersion: item.rowVersion,
        },
      });
      setToastBanner({
        type: 'success',
        message: `Đã hoàn lại tiêu chí về trạng thái chờ thẩm định!`,
      });
      setTimeout(() => setToastBanner(null), 3500);
      await Promise.all([refetchApp(), refetchEvs()]);
    } catch (err: unknown) {
      setToastBanner({ type: 'error', message: sanitizeApiError(err) });
    }
  };

  // Quick Review Modal Submission
  const handleSingleEvidenceReview = async (
    d: 'Approved' | 'Rejected' | 'NeedsRevision',
    note: string
  ) => {
    if (!quickReviewTarget) return;
    try {
      await reviewEvidence.mutateAsync({
        id: quickReviewTarget.id,
        body: {
          decision: d,
          note: note || null,
          rowVersion: quickReviewTarget.rowVersion,
        },
      });
      setQuickReviewTarget(null);
      setToastBanner({
        type: 'success',
        message: `Đã cập nhật đánh giá tiêu chí "${quickReviewTarget.criterionTitle}"!`,
      });
      setTimeout(() => setToastBanner(null), 3500);
      await Promise.all([refetchApp(), refetchEvs()]);
    } catch (err: unknown) {
      setToastBanner({ type: 'error', message: sanitizeApiError(err) });
    }
  };

  const handleSubmitFinalDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;
    setDecisionError(null);
    setDecisionSuccess(null);

    if (decision === 'Approved' && !isEligibleForApproval) {
      setDecisionError('Hồ sơ chưa đạt đủ 5/5 nhóm tiêu chuẩn. Không thể phê duyệt danh hiệu SV5T.');
      return;
    }

    if ((decision === 'NeedsRevision' || decision === 'Rejected') && !decisionNote.trim()) {
      setDecisionError('Bắt buộc phải nhập nhận xét / hướng dẫn phản hồi cho sinh viên.');
      return;
    }

    try {
      await decideApplication.mutateAsync({
        id: application.id,
        body: {
          decision,
          note: decisionNote.trim() || null,
          rowVersion: application.rowVersion,
        },
      });
      setDecisionSuccess(
        decision === 'Approved'
          ? 'Đã phê duyệt đạt danh hiệu SV5T cho hồ sơ này!'
          : decision === 'NeedsRevision'
          ? 'Đã gửi yêu cầu bổ sung minh chứng kèm nhận xét tới sinh viên!'
          : 'Đã từ chối hồ sơ kèm lý do phản hồi!'
      );
      onSuccessDecision?.();
      await refetchApp();
    } catch (err: unknown) {
      setDecisionError(sanitizeApiError(err));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 font-inter font-['Inter',_sans-serif]"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết hồ sơ dự xét SV5T"
        onClick={onClose}
      >
        {/* Modal Window: Khung hình chữ nhật phẳng hiện đại */}
        <div
          className="w-[96vw] max-w-[1420px] bg-white shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[95vh] animate-in zoom-in-95 duration-150 font-inter font-['Inter',_sans-serif]"
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <ApplicationDetailHeader
            application={application ?? null}
            snapshot={snapshot}
            avatarUrl={avatarUrl}
            onClose={onClose}
          />

          {/* Tab Navigation */}
          <div className="flex items-center gap-4 px-6 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('evidences')}
              className={`py-3 text-xs font-bold cursor-pointer transition-all border-b-2 inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'evidences'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award size={15} />
              <span>Tiêu chuẩn & Minh chứng ({evidences.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('decision')}
              className={`py-3 text-xs font-bold cursor-pointer transition-all border-b-2 inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'decision'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck size={15} />
              <span>Đánh giá & Duyệt hồ sơ</span>
              {application?.status === 'Submitted' && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`py-3 text-xs font-bold cursor-pointer transition-all border-b-2 inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'student'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User size={15} />
              <span>Hồ sơ sinh viên</span>
            </button>
          </div>

          {/* Modal Body Container */}
          <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-none">
            {appLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="text-blue-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-500">Đang tải chi tiết hồ sơ...</p>
              </div>
            ) : appError || !application ? (
              <div className="p-8 text-center space-y-3 m-6 bg-white rounded-xl border border-slate-200">
                <AlertCircle size={32} className="text-rose-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Không tìm thấy thông tin hồ sơ</h4>
                <button
                  type="button"
                  onClick={() => {
                    refetchApp();
                    refetchEvs();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                >
                  Thử tải lại
                </button>
              </div>
            ) : (
              <>
                {/* TAB 1: Criteria & Evidences (2-column split) */}
                {activeTab === 'evidences' && (
                  <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white">
                    <ApplicationDetailCriteriaTab
                      evidences={evidences}
                      filteredEvidences={filteredEvidences}
                      selectedGroupFilter={selectedGroupFilter}
                      onSelectGroupFilter={setSelectedGroupFilter}
                      expandedIds={expandedIds}
                      onToggleExpand={toggleExpand}
                      onToggleAll={handleToggleAll}
                      allExpanded={allExpanded}
                      evLoading={evLoading}
                      evError={evError}
                      errorMessage={evidenceError ? sanitizeApiError(evidenceError) : undefined}
                      onRefetchEvs={refetchEvs}
                      toastBanner={toastBanner}
                      onClearToastBanner={() => setToastBanner(null)}
                      isReviewPending={reviewEvidence.isPending}
                      onOpenViewer={handleOpenViewer}
                      onDirectApprove={handleDirectApprove}
                      onDirectRevert={handleDirectRevert}
                      onOpenQuickReview={(item) => setQuickReviewTarget(item)}
                    />

                    <div className="lg:w-5/12 xl:w-4/12 p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-white">
                      <ApplicationProgressPanel
                        standards={standards}
                        selectedGroupFilter={selectedGroupFilter}
                        onSelectGroupFilter={setSelectedGroupFilter}
                        isEligibleForApproval={isEligibleForApproval}
                        completedStandardsCount={completedStandardsCount}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: Student Profile */}
                {activeTab === 'student' && (
                  <ApplicationDetailStudentTab snapshot={snapshot} avatarUrl={avatarUrl} />
                )}

                {/* TAB 3: Decision & Feedback */}
                {activeTab === 'decision' && (
                  <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white">
                    <ApplicationDetailDecisionTab
                      application={application}
                      decision={decision}
                      onDecisionChange={setDecision}
                      decisionNote={decisionNote}
                      onDecisionNoteChange={setDecisionNote}
                      decisionError={decisionError}
                      decisionSuccess={decisionSuccess}
                      isEligibleForApproval={isEligibleForApproval}
                      completedStandardsCount={completedStandardsCount}
                      isSubmitting={decideApplication.isPending}
                      onSubmit={handleSubmitFinalDecision}
                      onClose={onClose}
                    />

                    <div className="lg:w-5/12 xl:w-4/12 p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-white">
                      <ApplicationProgressPanel
                        standards={standards}
                        selectedGroupFilter={selectedGroupFilter}
                        onSelectGroupFilter={setSelectedGroupFilter}
                        isEligibleForApproval={isEligibleForApproval}
                        completedStandardsCount={completedStandardsCount}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Bar */}
          <ApplicationDetailFooter
            completedStandardsCount={completedStandardsCount}
            isEligibleForApproval={isEligibleForApproval}
            onRefresh={() => {
              refetchApp();
              refetchEvs();
            }}
            onClose={onClose}
          />
        </div>
      </div>

      {/* Advanced Evidence Viewer Modal */}
      <EvidenceViewerModal
        isOpen={viewerOpen}
        evidence={viewingEvidence}
        initialAttachmentIndex={viewingAttachmentIndex}
        allEvidences={evidences}
        onClose={() => setViewerOpen(false)}
      />

      {/* Quick Individual Evidence Review Modal */}
      <EvidenceReviewQuickModal
        isOpen={Boolean(quickReviewTarget)}
        evidence={quickReviewTarget}
        isLoading={reviewEvidence.isPending}
        onClose={() => setQuickReviewTarget(null)}
        onSubmit={handleSingleEvidenceReview}
      />
    </>
  );
};

export default ApplicationDetailModal;
