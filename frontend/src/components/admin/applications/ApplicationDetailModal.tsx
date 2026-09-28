import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  HeartHandshake,
  Loader2,
  MessageSquare,
  RefreshCw,
  Scale,
  ShieldCheck,
  User,
  X,
  Zap,
} from 'lucide-react';
import {
  useApplicationDetail,
  useApplicationEvidences,
  useApplicationReviewMutations,
} from '../../../hooks/admin/useApplicationReview';
import type {
  AdminEvidenceItem,
  ApplicantSnapshot,
  EvidenceAttachment,
  StandardProgress,
} from '../../../types/admin/application';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { EvidenceReviewQuickModal } from './EvidenceReviewQuickModal';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  applicationId: string | null;
  onClose: () => void;
  onSuccessDecision?: () => void;
}

const GROUP_LABELS: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; border: string }> = {
  Ethics: {
    label: 'Đạo đức tốt',
    icon: ShieldCheck,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  Study: {
    label: 'Học tập tốt',
    icon: BookOpen,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  Fitness: {
    label: 'Thể lực tốt',
    icon: Zap,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  Volunteer: {
    label: 'Tình nguyện tốt',
    icon: HeartHandshake,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  Integration: {
    label: 'Hội nhập tốt',
    icon: Scale,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  Draft: { label: 'Bản nháp', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', icon: Clock },
  Submitted: { label: 'Đã nộp — Chờ duyệt', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock },
  UnderReview: { label: 'Đang thẩm định', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: Clock },
  NeedsRevision: { label: 'Yêu cầu bổ sung', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  Resubmitted: { label: 'Đã nộp lại', color: 'text-cyan-800', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: RefreshCw },
  Approved: { label: 'Đạt danh hiệu SV5T', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  Rejected: { label: 'Không đạt / Từ chối', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertCircle },
  Withdrawn: { label: 'Đã rút hồ sơ', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock },
};

const EVIDENCE_STATUS_BADGE: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  Draft: { label: 'Chưa nộp', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Submitted: { label: 'Chờ duyệt', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Approved: { label: 'Đạt tiêu chí', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  NeedsRevision: { label: 'Cần bổ sung', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Rejected: { label: 'Không đạt', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  applicationId,
  onClose,
  onSuccessDecision,
}) => {
  const [activeTab, setActiveTab] = useState<'evidences' | 'student' | 'decision'>('evidences');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingEvidence, setViewingEvidence] = useState<AdminEvidenceItem | null>(null);
  const [viewingAttachmentIndex, setViewingAttachmentIndex] = useState(0);

  // Quick evidence review state
  const [quickReviewTarget, setQuickReviewTarget] = useState<AdminEvidenceItem | null>(null);

  // Final Decision Form State
  const [decision, setDecision] = useState<'Approved' | 'NeedsRevision' | 'Rejected'>('Approved');
  const [decisionNote, setDecisionNote] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  const {
    data: application,
    isLoading: appLoading,
    isError: appError,
    refetch: refetchApp,
  } = useApplicationDetail(isOpen ? applicationId : null);

  const {
    data: evidencesData,
    isLoading: evLoading,
    refetch: refetchEvs,
  } = useApplicationEvidences(isOpen ? applicationId : null);

  const { decideApplication, reviewEvidence } = useApplicationReviewMutations();

  // Parse Applicant Snapshot
  const snapshot: ApplicantSnapshot = useMemo(() => {
    if (!application?.applicantSnapshotJson) return {};
    try {
      return JSON.parse(application.applicantSnapshotJson);
    } catch {
      return {};
    }
  }, [application?.applicantSnapshotJson]);

  const evidences = evidencesData?.items ?? [];
  const standards: StandardProgress[] = application?.standards ?? [];
  const completedStandardsCount = standards.filter((s) => s.complete).length;
  const isEligibleForApproval = completedStandardsCount === 5;

  // Filtered Evidences
  const filteredEvidences = useMemo(() => {
    if (selectedGroupFilter === 'all') return evidences;
    return evidences.filter((e) => {
      return e.criterionCode?.startsWith(selectedGroupFilter.slice(0, 2)) || e.criterionTitle;
    });
  }, [evidences, selectedGroupFilter]);

  const handleOpenViewer = (ev: AdminEvidenceItem, attIndex = 0) => {
    setViewingEvidence(ev);
    setViewingAttachmentIndex(attIndex);
    setViewerOpen(true);
  };

  const handleSingleEvidenceReview = async (
    d: 'Approved' | 'Rejected' | 'NeedsRevision',
    note: string
  ) => {
    if (!quickReviewTarget) return;
    await reviewEvidence.mutateAsync({
      id: quickReviewTarget.id,
      body: {
        decision: d,
        note: note || null,
        rowVersion: quickReviewTarget.rowVersion,
      },
    });
    await refetchApp();
    await refetchEvs();
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

  const currentStatusConf = STATUS_CONFIG[application?.status ?? 'Submitted'] || STATUS_CONFIG.Submitted;
  const StatusIcon = currentStatusConf.icon;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết hồ sơ dự xét SV5T"
        onClick={onClose}
      >
        <div
          className="w-full max-w-6xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-gradient-to-r from-sky-50/60 via-white to-white shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20 shrink-0">
                {(snapshot.fullName?.charAt(0) || 'S').toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {snapshot.fullName || 'Hồ sơ sinh viên'}
                  </h3>
                  {snapshot.studentCode && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                      {snapshot.studentCode}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentStatusConf.bg} ${currentStatusConf.color} ${currentStatusConf.border}`}
                  >
                    <StatusIcon size={13} />
                    <span>{currentStatusConf.label}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 truncate">
                  <span className="font-medium text-slate-700 truncate">
                    {application?.campaignName || 'Chiến dịch SV5T'}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-400 truncate">
                    {application?.applicationCode}
                  </span>
                  {application?.submittedAt && (
                    <>
                      <span>•</span>
                      <span className="text-slate-400">
                        Nộp: {new Date(application.submittedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-4 px-6 border-b border-slate-100 bg-white shrink-0 overflow-x-auto">
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
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
            {appLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="text-blue-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-500">Đang tải chi tiết hồ sơ...</p>
              </div>
            ) : appError || !application ? (
              <div className="p-8 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
                <AlertCircle size={32} className="text-rose-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Không tìm thấy thông tin hồ sơ</h4>
                <button
                  type="button"
                  onClick={() => {
                    refetchApp();
                    refetchEvs();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                >
                  Thử tải lại
                </button>
              </div>
            ) : (
              <>
                {/* TAB 1: EVIDENCES & 5 STANDARDS OVERVIEW */}
                {activeTab === 'evidences' && (
                  <div className="space-y-6">
                    {/* 5 Standard Groups Summary Cards */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Award size={18} className="text-blue-600" />
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                            Tiến độ 5 nhóm tiêu chuẩn SV5T
                          </h4>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          <span>Đạt:</span>
                          <strong className={isEligibleForApproval ? 'text-emerald-700' : 'text-blue-700'}>
                            {completedStandardsCount} / 5 nhóm
                          </strong>
                          {isEligibleForApproval ? (
                            <span className="text-emerald-600 font-bold ml-1">(Đủ điều kiện xét duyệt)</span>
                          ) : (
                            <span className="text-amber-600 ml-1">(Chưa đủ 5 nhóm)</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        {(['Ethics', 'Study', 'Fitness', 'Volunteer', 'Integration'] as const).map((groupKey) => {
                          const config = GROUP_LABELS[groupKey];
                          const Icon = config.icon;
                          const std = standards.find((s) => s.groupCode === groupKey);
                          const isComplete = std?.complete ?? false;
                          const approved = std?.approvedCount ?? 0;
                          const required = std?.requiredCount ?? 1;

                          return (
                            <div
                              key={groupKey}
                              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                                isComplete
                                  ? 'bg-emerald-50/60 border-emerald-200 shadow-2xs'
                                  : 'bg-slate-50/80 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5 mb-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                  <Icon size={14} className={isComplete ? 'text-emerald-600' : 'text-slate-500'} />
                                  <span className="truncate">{config.label}</span>
                                </span>
                                {isComplete ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    ĐẠT
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-semibold">
                                    CHƯA
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-slate-500">
                                  <span>Đã duyệt:</span>
                                  <span className="font-mono font-bold text-slate-700">
                                    {approved} / {required}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isComplete ? 'bg-emerald-500' : 'bg-blue-500'
                                    }`}
                                    style={{
                                      width: `${required > 0 ? Math.min(100, Math.round((approved / required) * 100)) : 0}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filter by Group Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="text-xs text-slate-500 font-semibold shrink-0">Lọc theo nhóm:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedGroupFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                          selectedGroupFilter === 'all'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Tất cả ({evidences.length})
                      </button>
                      {Object.entries(GROUP_LABELS).map(([key, item]) => {
                        const count = evidences.filter((e) => e.criterionCode?.startsWith(key.slice(0, 2))).length;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedGroupFilter(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                              selectedGroupFilter === key
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {item.label} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Evidence Cards List */}
                    {evLoading ? (
                      <div className="py-12 flex justify-center">
                        <Loader2 size={24} className="text-blue-600 animate-spin" />
                      </div>
                    ) : filteredEvidences.length === 0 ? (
                      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        <FileText size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Chưa có minh chứng nào được nộp cho nhóm này.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredEvidences.map((ev) => {
                          const evStatusConf = EVIDENCE_STATUS_BADGE[ev.status] || EVIDENCE_STATUS_BADGE.Draft;

                          // Parse dataJson and attachmentsJson
                          let parsedData: { description?: string; driveLink?: string; link?: string } = {};
                          try {
                            if (ev.dataJson) parsedData = JSON.parse(ev.dataJson);
                          } catch {
                            parsedData = {};
                          }

                          let attachments: EvidenceAttachment[] = [];
                          try {
                            if (ev.attachmentsJson) {
                              const p = JSON.parse(ev.attachmentsJson);
                              attachments = Array.isArray(p) ? p : [p];
                            }
                          } catch {
                            attachments = [];
                          }

                          return (
                            <div
                              key={ev.id}
                              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all p-4 sm:p-5 space-y-3.5"
                            >
                              {/* Top Bar of Criterion */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                      {ev.criterionCode}
                                    </span>
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                      {ev.criterionTitle}
                                    </h4>
                                  </div>
                                  {ev.numericValue != null && (
                                    <p className="text-xs text-slate-500">
                                      Điểm / Số liệu tự khai:{' '}
                                      <strong className="text-slate-800">{ev.numericValue}</strong>
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${evStatusConf.bg} ${evStatusConf.text}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${evStatusConf.dot}`} />
                                    <span>{evStatusConf.label}</span>
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => setQuickReviewTarget(ev)}
                                    className="px-3 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                                  >
                                    Đánh giá
                                  </button>
                                </div>
                              </div>

                              {/* Student Description / Note */}
                              {parsedData.description && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed">
                                  <span className="font-semibold text-slate-800 block mb-0.5">
                                    Ghi chú của sinh viên:
                                  </span>
                                  <p className="whitespace-pre-wrap">{parsedData.description}</p>
                                </div>
                              )}

                              {/* Drive link if provided */}
                              {(parsedData.driveLink || parsedData.link) && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-slate-500 font-medium">Link Drive:</span>
                                  <a
                                    href={parsedData.driveLink || parsedData.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium truncate max-w-md"
                                  >
                                    <ExternalLink size={13} />
                                    <span>{parsedData.driveLink || parsedData.link}</span>
                                  </a>
                                </div>
                              )}

                              {/* Uploaded Attachments Grid (Images & Files) */}
                              {attachments.length > 0 && (
                                <div className="space-y-2 pt-1">
                                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Tệp minh chứng đính kèm ({attachments.length}):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {attachments.map((att, attIdx) => {
                                      const url = att.url || att.fileUrl || att.secure_url || '';
                                      const name = att.fileName || att.name || `Tệp ${attIdx + 1}`;
                                      const isPdf = /\.pdf($|\?)/i.test(name) || /\.pdf($|\?)/i.test(url);

                                      return (
                                        <div
                                          key={attIdx}
                                          onClick={() => handleOpenViewer(ev, attIdx)}
                                          className="group relative flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/40 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                                        >
                                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            {isPdf ? (
                                              <FileText size={22} className="text-rose-600" />
                                            ) : url ? (
                                              <img
                                                src={url}
                                                alt={name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                              />
                                            ) : (
                                              <FileCheck size={22} className="text-blue-600" />
                                            )}
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate" title={name}>
                                              {name}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                              <span>{isPdf ? 'Tài liệu PDF' : 'Ảnh minh chứng'}</span>
                                              <span>•</span>
                                              <span className="text-blue-600 font-medium group-hover:underline inline-flex items-center gap-0.5">
                                                <Eye size={11} /> Xem
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Reviewer Note if previously evaluated */}
                              {ev.reviewerNote && (
                                <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/70 text-xs text-sky-950 space-y-1">
                                  <div className="flex items-center gap-1.5 font-bold text-sky-900">
                                    <MessageSquare size={13} className="text-sky-600" />
                                    <span>Nhận xét của Mentor / Hội đồng:</span>
                                    {ev.reviewedAt && (
                                      <span className="text-[10px] font-normal text-sky-700">
                                        ({new Date(ev.reviewedAt).toLocaleString('vi-VN')})
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-800 font-medium leading-relaxed pl-4">
                                    {ev.reviewerNote}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: STUDENT PROFILE */}
                {activeTab === 'student' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-slate-800">
                        <GraduationCap size={18} className="text-blue-600" />
                        <span>Thông tin học vụ</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Họ và tên sinh viên:</span>
                          <span className="text-slate-800 font-semibold text-sm mt-0.5 block">
                            {snapshot.fullName || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Mã số sinh viên (MSSV):</span>
                          <span className="font-mono text-slate-800 font-bold text-sm mt-0.5 block">
                            {snapshot.studentCode || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Trường:</span>
                          <span className="text-slate-700 font-medium mt-0.5 block">
                            {snapshot.school || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Khoa / Viện:</span>
                          <span className="text-slate-700 font-medium mt-0.5 block">
                            {snapshot.faculty || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Chuyên ngành:</span>
                          <span className="text-slate-700 font-medium mt-0.5 block">
                            {snapshot.major || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Lớp hành chính:</span>
                          <span className="text-slate-700 font-mono font-medium mt-0.5 block">
                            {snapshot.administrativeClass || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Khóa tuyển sinh:</span>
                          <span className="text-slate-700 font-medium mt-0.5 block">
                            {snapshot.academicYear ? `K${snapshot.academicYear}` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Email sinh viên:</span>
                          <span className="text-slate-700 font-medium mt-0.5 block">
                            {snapshot.email || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: DECISION & FEEDBACK (Duyệt hồ sơ hay không và gửi feedback) */}
                {activeTab === 'decision' && (
                  <form
                    onSubmit={handleSubmitFinalDecision}
                    className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs max-w-3xl mx-auto"
                  >
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Quyết định công nhận danh hiệu Sinh viên 5 Tốt
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Kết quả đánh giá và phản hồi sẽ được gửi trực tiếp đến trang cá nhân của sinh viên.
                      </p>
                    </div>

                    {/* Standard Completion Status Alert */}
                    <div
                      className={`p-4 rounded-xl border flex items-start gap-3 ${
                        isEligibleForApproval
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      {isEligibleForApproval ? (
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="text-xs">
                        <span className="font-bold block">
                          Tiến độ tiêu chuẩn: {completedStandardsCount} / 5 nhóm hoàn thành
                        </span>
                        <p className="mt-0.5 text-slate-700 leading-relaxed">
                          {isEligibleForApproval
                            ? 'Hồ sơ đã đạt đầy đủ 5/5 tiêu chuẩn Sinh viên 5 Tốt. Bạn có thể tiến hành Phê duyệt chính thức.'
                            : 'Hồ sơ chưa hoàn thành đủ cả 5 nhóm tiêu chuẩn. Quy định chỉ cho phép Phê duyệt (Approved) khi đủ cả 5 nhóm. Bạn có thể chọn Yêu cầu bổ sung hoặc Từ chối kèm nhận xét hướng dẫn.'}
                        </p>
                      </div>
                    </div>

                    {/* Decision Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Chọn kết quả xét duyệt hồ sơ:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Approved */}
                        <label
                          className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                            decision === 'Approved'
                              ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                              : isEligibleForApproval
                              ? 'border-slate-200 hover:border-slate-300 text-slate-700'
                              : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <input
                            type="radio"
                            name="final-decision"
                            disabled={!isEligibleForApproval}
                            className="hidden"
                            checked={decision === 'Approved'}
                            onChange={() => setDecision('Approved')}
                          />
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold">Phê duyệt</span>
                            <CheckCircle2 size={18} className={decision === 'Approved' ? 'text-emerald-600' : 'text-slate-400'} />
                          </div>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            Công nhận đạt danh hiệu SV5T cấp trường
                          </span>
                        </label>

                        {/* NeedsRevision */}
                        <label
                          className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                            decision === 'NeedsRevision'
                              ? 'border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="final-decision"
                            className="hidden"
                            checked={decision === 'NeedsRevision'}
                            onChange={() => setDecision('NeedsRevision')}
                          />
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold">Yêu cầu bổ sung</span>
                            <Clock size={18} className={decision === 'NeedsRevision' ? 'text-amber-600' : 'text-slate-400'} />
                          </div>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            Yêu cầu sinh viên sửa / nộp thêm minh chứng
                          </span>
                        </label>

                        {/* Rejected */}
                        <label
                          className={`p-4 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                            decision === 'Rejected'
                              ? 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="final-decision"
                            className="hidden"
                            checked={decision === 'Rejected'}
                            onChange={() => setDecision('Rejected')}
                          />
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold">Từ chối hồ sơ</span>
                            <AlertCircle size={18} className={decision === 'Rejected' ? 'text-rose-600' : 'text-slate-400'} />
                          </div>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            Không đạt yêu cầu danh hiệu SV5T đợt này
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Feedback Note Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>
                          Nhận xét & Hướng dẫn (Feedback gửi sinh viên){' '}
                          {decision !== 'Approved' && <span className="text-rose-500">*</span>}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {decisionNote.length}/2000 ký tự
                        </span>
                      </div>
                      <textarea
                        rows={5}
                        value={decisionNote}
                        onChange={(e) => setDecisionNote(e.target.value)}
                        placeholder={
                          decision === 'Approved'
                            ? 'Chúc mừng sinh viên! Ghi nhận xét biểu dương hoặc căn dặn thêm (không bắt buộc)...'
                            : decision === 'NeedsRevision'
                            ? 'Ghi rõ các tiêu chí cần bổ sung, loại giấy tờ yêu cầu, thời hạn sinh viên phải hoàn thành...'
                            : 'Ghi rõ lý do hồ sơ chưa đáp ứng tiêu chuẩn Sinh viên 5 Tốt đợt này...'
                        }
                        className="w-full text-xs rounded-2xl border border-slate-200 p-3.5 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors leading-relaxed"
                      />
                    </div>

                    {/* Quick feedback templates */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                        Gợi ý nhận xét nhanh:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          'Hồ sơ xuất sắc, hoàn thành đầy đủ 5 tiêu chuẩn SV5T.',
                          'Cần bổ sung giấy xác nhận tham gia hoạt động tình nguyện Mùa hè xanh / Tiếp sức mùa thi.',
                          'Bảng điểm thiếu dấu xác nhận phòng Đào tạo, vui lòng xin cấp lại và cập nhật trước hạn.',
                          'Minh chứng tiêu chuẩn Thể lực tốt chưa rõ ràng, đề nghị nộp giấy chứng nhận đạt chuẩn rèn luyện thể lực.',
                        ].map((tpl) => (
                          <button
                            key={tpl}
                            type="button"
                            onClick={() => setDecisionNote((prev) => (prev ? `${prev}\n${tpl}` : tpl))}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer text-left"
                          >
                            {tpl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Current feedback if already stored */}
                    {(application.reviewerGeneralNote || application.rejectionReason) && (
                      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-slate-700 block">
                          Nhận xét đã lưu trước đó:
                        </span>
                        <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                          {application.reviewerGeneralNote || application.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Error Banner */}
                    {decisionError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{decisionError}</span>
                      </div>
                    )}

                    {/* Success Banner */}
                    {decisionSuccess && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>{decisionSuccess}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={decideApplication.isPending || (decision === 'Approved' && !isEligibleForApproval)}
                        className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                          decision === 'Approved'
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                            : decision === 'NeedsRevision'
                            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                            : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                        }`}
                      >
                        {decideApplication.isPending && <Loader2 size={14} className="animate-spin" />}
                        <span>Lưu kết quả xét duyệt & Gửi phản hồi</span>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">{application?.applicationCode}</span>
              <span>•</span>
              <span>Đạt: {completedStandardsCount}/5 nhóm</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  refetchApp();
                  refetchEvs();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Tải lại</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Evidence Viewer Modal (Pan, Zoom, Rotate, Download) */}
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
