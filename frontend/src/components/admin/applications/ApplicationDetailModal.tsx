import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
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
  RotateCcw,
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
import { studentService } from '../../../services/admin/studentService';
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

const STANDARD_GROUPS: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; border: string }
> = {
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
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
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

const RADAR_AXES = [
  { code: 'Ethics', label: 'Đạo đức', angle: -Math.PI / 2, anchor: 'middle' as const, dx: 0, dy: -8 },
  { code: 'Study', label: 'Học tập', angle: -Math.PI / 2 + (2 * Math.PI) / 5, anchor: 'start' as const, dx: 6, dy: 4 },
  { code: 'Fitness', label: 'Thể lực', angle: -Math.PI / 2 + (4 * Math.PI) / 5, anchor: 'start' as const, dx: 6, dy: 10 },
  { code: 'Volunteer', label: 'Tình nguyện', angle: -Math.PI / 2 + (6 * Math.PI) / 5, anchor: 'end' as const, dx: -6, dy: 10 },
  { code: 'Integration', label: 'Hội nhập', angle: -Math.PI / 2 + (8 * Math.PI) / 5, anchor: 'end' as const, dx: -6, dy: 4 },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  Draft: { label: 'Bản nháp', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', icon: Clock },
  Submitted: { label: 'Đã nộp', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock },
  UnderReview: { label: 'Đang thẩm định', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: Clock },
  NeedsRevision: { label: 'Yêu cầu bổ sung', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  Resubmitted: { label: 'Đã nộp lại', color: 'text-cyan-800', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: RefreshCw },
  Approved: { label: 'Đạt danh hiệu SV5T', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  Rejected: { label: 'Không đạt / Từ chối', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertCircle },
  Withdrawn: { label: 'Đã rút hồ sơ', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock },
};

const EVIDENCE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  Approved: { label: 'Đã duyệt', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Rejected: { label: 'Từ chối', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  NeedsRevision: { label: 'Cần sửa đổi', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Submitted: { label: 'Chờ thẩm định', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Draft: { label: 'Bản nháp', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
};

function parseData(jsonStr?: string): { description: string; driveLink: string } {
  if (!jsonStr) return { description: '', driveLink: '' };
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      description: parsed.description || parsed.notes || '',
      driveLink: parsed.driveLink || parsed.link || parsed.url || '',
    };
  } catch {
    return { description: jsonStr, driveLink: '' };
  }
}

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
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
    isError: evError,
    error: evidenceError,
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

  const currentStatusConf = STATUS_CONFIG[application?.status ?? 'Submitted'] || STATUS_CONFIG.Submitted;
  const StatusIcon = currentStatusConf.icon;

  // Radar Chart Calculations (Clean, Tidy, Pentagon Grid)
  const radarCx = 170;
  const radarCy = 125;
  const radarR = 76;
  const radarLevels = [0.25, 0.5, 0.75, 1.0];

  const radarDataPoints = RADAR_AXES.map((axis) => {
    const std = standards.find((s) => s.groupCode === axis.code);
    const isComplete = std?.complete ?? false;
    const approved = std?.approvedCount ?? 0;
    const required = std?.requiredCount ?? 1;
    const rate = isComplete ? 1 : Math.max(0.15, Math.min(1, approved / Math.max(1, required)));
    const px = radarCx + radarR * rate * Math.cos(axis.angle);
    const py = radarCy + radarR * rate * Math.sin(axis.angle);
    const labelX = radarCx + (radarR + 24) * Math.cos(axis.angle) + axis.dx;
    const labelY = radarCy + (radarR + 24) * Math.sin(axis.angle) + axis.dy;
    return {
      ...axis,
      std,
      isComplete,
      approved,
      required,
      rate,
      px,
      py,
      labelX,
      labelY,
    };
  });

  const radarPolygonPoints = radarDataPoints.map((p) => `${p.px},${p.py}`).join(' ');

  // Right Pane: Chart & 5 Standards Progress (KHÔNG tạo bảng bo góc, phẳng và liền mạch)
  const renderRightProgressPanel = () => (
    <div className="space-y-4 font-inter font-['Inter',_sans-serif]">
      {/* Header of Progress Section */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Đánh giá tiến độ 5 tiêu chí
            </h4>
            <p className="text-[11px] text-slate-500">Biểu đồ đối soát tiêu chuẩn SV5T</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
            isEligibleForApproval
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {isEligibleForApproval ? (
            <>
              <CheckCircle2 size={13} />
              <span>5 / 5 Nhóm đạt</span>
            </>
          ) : (
            <>
              <AlertTriangle size={13} />
              <span>{completedStandardsCount} / 5 Nhóm</span>
            </>
          )}
        </span>
      </div>

      {/* Modern Clean SVG Radar Chart */}
      <div className="relative flex flex-col items-center justify-center pt-1 pb-1">
        <svg
          viewBox="0 0 340 250"
          className="w-full max-w-[315px] h-auto overflow-visible select-none drop-shadow-2xs"
          role="img"
          aria-label="Biểu đồ ngũ giác tiến độ 5 tiêu chí"
        >
          <defs>
            <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.15" />
            </linearGradient>
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Concentric Grid Pentagons */}
          {radarLevels.map((lvl) => {
            const pts = RADAR_AXES.map((a) => {
              const x = radarCx + radarR * lvl * Math.cos(a.angle);
              return `${x},${radarCy + radarR * lvl * Math.sin(a.angle)}`;
            }).join(' ');

            return (
              <polygon
                key={lvl}
                points={pts}
                fill={lvl === 1.0 ? '#f8fafc' : 'none'}
                stroke="#e2e8f0"
                strokeWidth={lvl === 1.0 ? '1.5' : '1'}
                strokeDasharray={lvl === 1.0 ? undefined : '3 3'}
              />
            );
          })}

          {/* Axes Lines */}
          {RADAR_AXES.map((a) => {
            const x2 = radarCx + radarR * Math.cos(a.angle);
            const y2 = radarCy + radarR * Math.sin(a.angle);
            return (
              <line
                key={a.code}
                x1={radarCx}
                y1={radarCy}
                x2={x2}
                y2={y2}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            );
          })}

          {/* Value Area Polygon */}
          <polygon
            points={radarPolygonPoints}
            fill="url(#radarFillGrad)"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="url(#radarGlow)"
            className="transition-all duration-300"
          />

          {/* Center Badge */}
          <circle
            cx={radarCx}
            cy={radarCy}
            r="16"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="shadow-xs"
          />
          <text
            x={radarCx}
            y={radarCy + 4}
            textAnchor="middle"
            className="text-[10px] font-bold fill-slate-800 font-mono"
          >
            {completedStandardsCount}/5
          </text>

          {/* Vertex Points & Labels */}
          {radarDataPoints.map((pt) => {
            const isSelected = selectedGroupFilter.toLowerCase() === pt.code.toLowerCase();

            return (
              <g key={pt.code} className="cursor-pointer" onClick={() => setSelectedGroupFilter(isSelected ? 'all' : pt.code)}>
                {/* Vertex Marker Dot */}
                <circle
                  cx={pt.px}
                  cy={pt.py}
                  r="4.5"
                  fill={pt.isComplete ? '#10b981' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-transform duration-200 hover:scale-125"
                />

                {/* Outer Axis Label */}
                <text
                  x={pt.labelX}
                  y={pt.labelY}
                  textAnchor={pt.anchor}
                  className={`text-[11px] font-semibold transition-colors ${
                    isSelected ? 'fill-blue-600 font-bold' : 'fill-slate-700 hover:fill-blue-600'
                  }`}
                >
                  {pt.label}
                </text>
                <text
                  x={pt.labelX}
                  y={pt.labelY + 12}
                  textAnchor={pt.anchor}
                  className={`text-[9.5px] font-bold ${
                    pt.isComplete ? 'fill-emerald-600' : 'fill-slate-400'
                  }`}
                >
                  {pt.isComplete ? 'ĐẠT' : `${pt.approved}/${pt.required}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 5 Standards Compact List with Mini Progress Bars (Clickable to Filter) */}
      <div className="space-y-2 pt-1 border-t border-slate-200">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
          Chi tiết 5 nhóm tiêu chuẩn (nhấn để lọc):
        </span>

        <div className="space-y-1.5">
          {RADAR_AXES.map((axis) => {
            const std = standards.find((s) => s.groupCode === axis.code);
            const isComplete = std?.complete ?? false;
            const approved = std?.approvedCount ?? 0;
            const required = std?.requiredCount ?? 1;
            const config = STANDARD_GROUPS[axis.code];
            const Icon = config.icon;
            const isSelected = selectedGroupFilter.toLowerCase() === axis.code.toLowerCase();

            return (
              <div
                key={axis.code}
                onClick={() => setSelectedGroupFilter(isSelected ? 'all' : axis.code)}
                className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/90 text-blue-900 border border-blue-200 shadow-2xs'
                    : 'hover:bg-slate-100/70 border border-transparent hover:border-slate-200/60'
                }`}
                title={`Lọc danh sách tiêu chí theo nhóm ${config.label}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      {config.label}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-16 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isComplete ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${required > 0 ? Math.min(100, Math.round((approved / required) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {approved}/{required}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 size={11} />
                      <span>Đạt</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <span>Chưa đạt</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval Eligibility Alert Box */}
      <div
        className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
          isEligibleForApproval
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}
      >
        {isEligibleForApproval ? (
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
        ) : (
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
        )}
        <div className="leading-snug">
          {isEligibleForApproval ? (
            <span className="font-semibold">Hồ sơ đã đạt đủ 5/5 tiêu chuẩn. Đủ điều kiện phê duyệt danh hiệu.</span>
          ) : (
            <span>Hồ sơ còn thiếu <strong>{5 - completedStandardsCount}</strong> nhóm để đủ điều kiện công nhận.</span>
          )}
        </div>
      </div>
    </div>
  );

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
        {/* Modal Window: Khung hình chữ nhật thuần, phẳng hiện đại */}
        <div
          className="w-[96vw] max-w-[1420px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150 font-inter font-['Inter',_sans-serif]"
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: Hiển thị avatar tròn của sinh viên, MSSV (font Inter không background), Họ tên bên trái; Trạng thái và Nút đóng bên phải */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-white shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Student Circular Avatar (Bo tròn hoàn toàn, fetch ảnh sinh viên) */}
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-blue-500/20 shadow-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={snapshot.fullName || 'Sinh viên'}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="font-bold text-lg">
                    {(snapshot.fullName?.charAt(0) || 'S').toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap font-inter">
                  <h3 className="text-sm font-semibold text-slate-900 font-inter truncate">
                    {snapshot.fullName || 'Hồ sơ sinh viên'}
                  </h3>
                  {snapshot.studentCode && (
                    <span className="text-sm font-semibold text-slate-600 font-inter">
                      MSSV: {snapshot.studentCode}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1 flex-wrap font-inter">
                  {application?.campaignName && (
                    <span className="font-normal text-slate-500 truncate font-inter">
                      Chiến dịch: <span className="text-slate-700 font-normal">{application.campaignName}</span>
                    </span>
                  )}
                  {application?.submittedAt && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500 font-normal font-inter">
                        Nộp: {new Date(application.submittedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Trạng thái nằm bên cạnh nút X (phía bên trái nút X) */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentStatusConf.bg} ${currentStatusConf.color} ${currentStatusConf.border} font-inter`}
              >
                <StatusIcon size={14} />
                <span>{currentStatusConf.label}</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
          </div>

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

          {/* Modal Body Container: Vạch kẻ liền chia hai bên trái - phải không khoảng cách */}
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
                {/* TAB 1: 2-COLUMN CÓ ĐƯỜNG VẠCH LIỀN PHÂN CHIA RÕ RÀNG */}
                {activeTab === 'evidences' && (
                  <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white">
                    {/* BÊN TRÁI: KÍCH THƯỚC LỚN HƠN (lg:w-7/12 xl:w-8/12) - Giữ nguyên các trường & bảng đánh giá */}
                    <div className="flex-1 lg:w-7/12 xl:w-8/12 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-3.5 bg-slate-50/20">
                      {/* Inline Toast Banner */}
                      {toastBanner && (
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-150 ${
                            toastBanner.type === 'success'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {toastBanner.type === 'success' ? (
                              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle size={16} className="text-rose-600 shrink-0" />
                            )}
                            <span>{toastBanner.message}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setToastBanner(null)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {/* Filter by Group Pills */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-xs text-slate-500 font-semibold shrink-0">Lọc nhóm:</span>
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
                        {Object.entries(STANDARD_GROUPS).map(([key, item]) => {
                          const count = evidences.filter((e) => e.groupCode?.toLowerCase() === key.toLowerCase()).length;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setSelectedGroupFilter(key)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                                selectedGroupFilter.toLowerCase() === key.toLowerCase()
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {item.label} ({count})
                            </button>
                          );
                        })}
                      </div>

                      {/* Subheader: List Control Bar */}
                      <div className="px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
                        <span className="font-semibold text-slate-700">
                          Danh sách tiêu chí ({filteredEvidences.length})
                        </span>
                        {filteredEvidences.length > 1 && (
                          <button
                            type="button"
                            onClick={handleToggleAll}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition cursor-pointer hover:underline"
                          >
                            {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                          </button>
                        )}
                      </div>

                      {/* Criteria & Evidence Evaluation List */}
                      {evLoading ? (
                        <div className="py-12 flex justify-center">
                          <Loader2 size={24} className="text-blue-600 animate-spin" />
                        </div>
                      ) : evError ? (
                        <div className="p-10 text-center bg-white rounded-2xl border border-rose-200 text-rose-700">
                          <AlertCircle size={32} className="mx-auto mb-2" />
                          <p className="text-xs">{sanitizeApiError(evidenceError)}</p>
                          <button type="button" onClick={() => void refetchEvs()} className="mt-3 text-xs font-semibold underline">Thử lại</button>
                        </div>
                      ) : filteredEvidences.length === 0 ? (
                        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                          <FileText size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Chưa có minh chứng nào được nộp cho nhóm này.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredEvidences.map((ev) => {
                            const parsed = parseData(ev.dataJson);
                            const groupKey = ev.groupCode || 'Ethics';
                            const std = STANDARD_GROUPS[groupKey] || STANDARD_GROUPS.Ethics;
                            const StdIcon = std.icon;
                            const statusCfg = EVIDENCE_STATUS_CONFIG[ev.status] || EVIDENCE_STATUS_CONFIG.Submitted;
                            const isExpanded = Boolean(expandedIds[ev.id]);
                            const isApproved = ev.status === 'Approved';

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
                                className={`rounded-xl bg-white border transition-all shadow-2xs ${
                                  isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {/* Main Row: Bấm vào thanh này cũng mở/đóng dropbar */}
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => toggleExpand(ev.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      toggleExpand(ev.id);
                                    }
                                  }}
                                  className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/80 transition-colors rounded-xl"
                                >
                                  {/* Left: Info */}
                                  <div className="space-y-1.5 flex-1 min-w-0 pr-0 md:pr-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ${std.bg} ${std.color} border ${std.border}`}>
                                        <StdIcon size={13} />
                                        <span>{std.label}</span>
                                      </span>

                                      <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                                        {statusCfg.label}
                                      </span>

                                      <span className="text-slate-400 text-xs flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>{formatTimeAgo(ev.createdAt)}</span>
                                      </span>
                                    </div>

                                    {/* Criterion Title */}
                                    <p
                                      className="text-sm font-semibold text-slate-800 truncate leading-snug"
                                      title={ev.criterionTitle}
                                    >
                                      {ev.criterionTitle}
                                    </p>
                                  </div>

                                  {/* Right: "Chi tiết" toggle button on main row */}
                                  <div className="shrink-0 flex items-center pt-1 md:pt-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(ev.id);
                                      }}
                                      className={`h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs active:scale-[0.98] ${
                                        isExpanded
                                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                                      }`}
                                      title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                                    >
                                      <span>Chi tiết</span>
                                      <ChevronDown
                                        size={13}
                                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}
                                      />
                                    </button>
                                  </div>
                                </div>

                                {/* Collapsible Dropbar Panel: Bảng đánh giá chi tiết */}
                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-3.5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-3 animate-in fade-in duration-150">
                                    {/* Khung nội dung tự kê khai */}
                                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-2xs">
                                      <span className="font-semibold text-slate-900 block mb-1">
                                        Nội dung tự kê khai:
                                      </span>
                                      <p className="whitespace-pre-wrap text-slate-800">
                                        {parsed.description || (
                                          <span className="text-slate-400 italic">Sinh viên không nhập nội dung tự kê khai.</span>
                                        )}
                                      </p>
                                    </div>

                                    {/* Điểm / Số liệu tự khai nếu có */}
                                    {ev.numericValue != null && (
                                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                                        <span>Điểm / Số liệu tự khai:</span>
                                        <strong className="text-slate-800 font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                          {ev.numericValue}
                                        </strong>
                                      </div>
                                    )}

                                    {/* Drive Link nếu có */}
                                    {parsed.driveLink && (
                                      <div>
                                        <a
                                          href={parsed.driveLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer shadow-2xs"
                                        >
                                          <ExternalLink size={13} />
                                          <span>Mở liên kết Drive / URL minh chứng</span>
                                        </a>
                                      </div>
                                    )}

                                    {/* Danh sách tệp đính kèm nếu có */}
                                    {attachments.length > 0 && (
                                      <div className="space-y-1.5 pt-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                          Tệp đính kèm ({attachments.length}):
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                          {attachments.map((att, attIdx) => {
                                            const url = att.url || att.fileUrl || att.secure_url || '';
                                            const name = att.fileName || att.name || `Tệp ${attIdx + 1}`;
                                            const isPdf = /\.pdf($|\?)/i.test(name) || /\.pdf($|\?)/i.test(url);
                                            return (
                                              <div
                                                key={attIdx}
                                                onClick={() => handleOpenViewer(ev, attIdx)}
                                                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                                                title={`Xem tệp ${name}`}
                                              >
                                                {isPdf ? (
                                                  <FileText size={16} className="text-rose-500 shrink-0" />
                                                ) : (
                                                  <FileCheck size={16} className="text-blue-500 shrink-0" />
                                                )}
                                                <span className="text-xs text-slate-700 group-hover:text-blue-700 font-medium max-w-[200px] truncate">
                                                  {name}
                                                </span>
                                                <Eye size={12} className="text-blue-500 opacity-60 group-hover:opacity-100" />
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Reviewer Note nếu có */}
                                    {ev.reviewerNote && (
                                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 shadow-2xs">
                                        <span className="font-semibold block mb-0.5">Lời nhắc / Lý do phản hồi:</span>
                                        <p className="whitespace-pre-wrap">{ev.reviewerNote}</p>
                                      </div>
                                    )}

                                    {/* Các Nút hành động chuẩn thẩm định */}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 flex-wrap">
                                      {/* 1. Nút Xem tệp */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenViewer(ev, 0)}
                                        className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                                        title="Xem tệp minh chứng đính kèm"
                                      >
                                        <Eye size={13} className="text-slate-500" />
                                        <span>Xem tệp</span>
                                      </button>

                                      {/* 2. Nút Duyệt / Duyệt Đạt / Badge Đã duyệt */}
                                      {isApproved ? (
                                        <span
                                          className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 select-none shadow-2xs"
                                          title="Tiêu chí này đã được duyệt đạt"
                                        >
                                          <CheckCircle2 size={13} />
                                          <span>Đã duyệt</span>
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleDirectApprove(ev)}
                                          disabled={reviewEvidence.isPending}
                                          className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
                                          title={ev.status === 'Rejected' ? 'Xem xét lại và duyệt đạt tiêu chí này' : 'Duyệt đạt tiêu chí này'}
                                        >
                                          <CheckCircle2 size={13} />
                                          <span>Duyệt Đạt</span>
                                        </button>
                                      )}

                                      {/* 3. Nút Hoàn lại */}
                                      {(ev.status === 'Approved' || ev.status === 'Rejected' || ev.status === 'NeedsRevision') && (
                                        <button
                                          type="button"
                                          onClick={() => handleDirectRevert(ev)}
                                          disabled={reviewEvidence.isPending}
                                          className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
                                          title="Hoàn lại kết quả về trạng thái chờ thẩm định ban đầu"
                                        >
                                          <RotateCcw size={13} />
                                          <span>Hoàn lại</span>
                                        </button>
                                      )}

                                      {/* 4. Nút Phản hồi / Đánh giá */}
                                      <button
                                        type="button"
                                        onClick={() => setQuickReviewTarget(ev)}
                                        className="h-8 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold bg-[#1683ff] hover:bg-[#0866db] text-white transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                                        title="Gửi phản hồi hoặc thay đổi kết quả đánh giá"
                                      >
                                        <MessageSquare size={13} />
                                        <span>Đánh giá / Phản hồi</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* BÊN PHẢI: VẠCH KẺ LIỀN CHIA TRÁI PHẢI, LIỀN MẠCH TỪ TRÊN XUỐNG DƯỚI (lg:w-5/12 xl:w-4/12) */}
                    <div className="lg:w-5/12 xl:w-4/12 p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-white">
                      {renderRightProgressPanel()}
                    </div>
                  </div>
                )}

                {/* TAB 2: STUDENT PROFILE */}
                {activeTab === 'student' && (
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-50/20">
                    <div className="max-w-4xl mx-auto space-y-4">
                      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
                        {/* Top profile avatar header */}
                        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                          <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-blue-50 shadow-md shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={snapshot.fullName || 'Sinh viên'}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              (snapshot.fullName?.charAt(0) || 'S').toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-slate-900 font-inter">{snapshot.fullName || '—'}</h4>
                            <p className="text-sm font-semibold text-slate-600 mt-0.5 font-inter">
                              MSSV: {snapshot.studentCode || '—'}
                            </p>
                            {snapshot.administrativeClass && (
                              <p className="text-sm font-semibold text-slate-600 font-inter">
                                Lớp: {snapshot.administrativeClass}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pb-2 text-sm font-semibold text-slate-800 font-inter">
                          <GraduationCap size={18} className="text-blue-600" />
                          <span>Thông tin học vụ chi tiết</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-inter">
                          <div>
                            <span className="text-slate-500 block font-medium font-inter">Họ và tên sinh viên:</span>
                            <span className="text-slate-800 font-semibold text-sm mt-0.5 block font-inter">
                              {snapshot.fullName || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-medium font-inter">Mã số sinh viên (MSSV):</span>
                            <span className="text-slate-800 font-semibold text-sm mt-0.5 block font-inter">
                              {snapshot.studentCode || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-medium font-inter">Trường:</span>
                            <span className="text-slate-800 font-semibold text-sm mt-0.5 block font-inter">
                              {snapshot.school || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-medium font-inter">Khoa / Viện:</span>
                            <span className="text-slate-800 font-semibold text-sm mt-0.5 block font-inter">
                              {snapshot.faculty || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-medium font-inter">Chuyên ngành:</span>
                            <span className="text-slate-800 font-semibold text-sm mt-0.5 block font-inter">
                              {snapshot.major || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-medium font-inter">Lớp hành chính:</span>
                            <span className="text-slate-800 font-semibold text-sm mt-0.5 block font-inter">
                              {snapshot.administrativeClass || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-medium font-inter">Khóa tuyển sinh:</span>
                            <span className="text-slate-800 font-semibold text-sm mt-0.5 block font-inter">
                              {snapshot.academicYear ? `K${snapshot.academicYear}` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-medium font-inter">Email sinh viên:</span>
                            <span className="text-slate-800 font-semibold text-sm mt-0.5 block font-inter">
                              {snapshot.email || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: DECISION & FEEDBACK (Cũng chia 2 cột với vạch liền) */}
                {activeTab === 'decision' && (
                  <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white">
                    {/* BÊN TRÁI: Form Quyết định xét duyệt */}
                    <div className="flex-1 lg:w-7/12 xl:w-8/12 p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-50/20">
                      <form
                        onSubmit={handleSubmitFinalDecision}
                        className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs"
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
                              className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
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
                              className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
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
                              className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
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
                            className="w-full text-xs rounded-xl border border-slate-200 p-3.5 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors leading-relaxed"
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
                            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            Đóng
                          </button>
                          <button
                            type="submit"
                            disabled={decideApplication.isPending || (decision === 'Approved' && !isEligibleForApproval)}
                            className={`px-6 py-2.5 text-xs font-bold text-white rounded-lg shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
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
                    </div>

                    {/* BÊN PHẢI: Biểu đồ & tiến độ 5 tiêu chí */}
                    <div className="lg:w-5/12 xl:w-4/12 p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-white">
                      {renderRightProgressPanel()}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Bar: Chỉ hiển thị tiến độ và nút bấm - ĐÃ XÓA BỎ HỌ TÊN VÀ MSSV Ở ĐÂY */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0 rounded-none">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-inter">
              <span>Tiến độ tiêu chuẩn:</span>
              <strong className="text-slate-900 font-semibold">{completedStandardsCount} / 5</strong>
              <span className="text-slate-400">nhóm đạt</span>
              {isEligibleForApproval ? (
                <span className="text-emerald-600 font-bold ml-1 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  (Đủ điều kiện công nhận SV5T)
                </span>
              ) : (
                <span className="text-amber-600 font-medium ml-1">
                  (Chưa đủ 5 nhóm)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  refetchApp();
                  refetchEvs();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Tải lại</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
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

      {/* Quick Individual Evidence Review Modal (Đánh giá / Phản hồi) */}
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
