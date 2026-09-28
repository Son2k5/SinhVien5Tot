import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Eye,
  FileCheck2,
  HeartHandshake,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import {
  useApplicationReviewMutations,
  useEvidencesPaged,
} from '../../hooks/admin/useApplicationReview';
import { campaignService } from '../../services/admin/campaignService';
import type { CampaignResponse } from '../../types/admin/campaign';
import type {
  AdminEvidenceItem,
  ApplicantSnapshot,
} from '../../types/admin/application';
import { EvidenceViewerModal } from '../../components/admin/applications/EvidenceViewerModal';
import { EvidenceReviewQuickModal } from '../../components/admin/applications/EvidenceReviewQuickModal';
import { ApplicationDetailModal } from '../../components/admin/applications/ApplicationDetailModal';
import {
  EvidenceTableSkeleton,
  StudentEvidenceGroupModal,
  type StudentEvidenceGroup,
} from '../../components/admin/evidence';
import { sanitizeApiError } from '../../services/apiErrorSanitizer';

type ReviewTab = 'Submitted' | 'NeedsRevision' | 'Approved' | 'Rejected';

const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

const STATUS_CONFIG: Record<
  ReviewTab,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
    description: string;
  }
> = {
  Submitted: {
    label: 'Chờ xét duyệt',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-500',
    description: 'Danh sách sinh viên có minh chứng mới nộp hoặc nộp lại cần thẩm định',
  },
  NeedsRevision: {
    label: 'Yêu cầu bổ sung',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Danh sách sinh viên có minh chứng đang chờ cập nhật lại theo hướng dẫn',
  },
  Approved: {
    label: 'Đã duyệt',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    description: 'Danh sách sinh viên có minh chứng đã được xác nhận đạt chuẩn',
  },
  Rejected: {
    label: 'Từ chối',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-500',
    description: 'Danh sách sinh viên có minh chứng không đạt yêu cầu kèm lý do phản hồi',
  },
};

const STANDARD_GROUPS: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; border: string }
> = {
  Ethics: { label: 'Đạo đức tốt', icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Study: { label: 'Học tập tốt', icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Fitness: { label: 'Thể lực tốt', icon: Zap, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Volunteer: { label: 'Tình nguyện tốt', icon: HeartHandshake, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  Integration: { label: 'Hội nhập tốt', icon: Scale, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
};

function parseSnapshot(jsonStr?: string | null): ApplicantSnapshot {
  if (!jsonStr) return {};
  try {
    return JSON.parse(jsonStr);
  } catch {
    return {};
  }
}

function getDaysDiff(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const created = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
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

// ── Resizable columns: 13 cột với độ rộng default rộng rãi, thấy hết chữ ──
type EvidenceColKey =
  | 'check'
  | 'stt'
  | 'student'
  | 'studentCode'
  | 'email'
  | 'class'
  | 'faculty'
  | 'campaign'
  | 'standards'
  | 'evidenceCount'
  | 'submittedAt'
  | 'overdue'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<EvidenceColKey, number> = {
  check: 44,
  stt: 52,
  student: 200,
  studentCode: 110,
  email: 220,
  class: 110,
  faculty: 180,
  campaign: 240,
  standards: 240,
  evidenceCount: 110,
  submittedAt: 115,
  overdue: 125,
  actions: 90,
};

const MIN_COL_WIDTHS: Record<EvidenceColKey, number> = {
  check: 40,
  stt: 44,
  student: 130,
  studentCode: 85,
  email: 140,
  class: 80,
  faculty: 110,
  campaign: 140,
  standards: 150,
  evidenceCount: 85,
  submittedAt: 90,
  overdue: 95,
  actions: 75,
};

const COL_STORAGE_KEY = 'sv5t-evidence-table-colwidths-v3';

export function EvidenceReviewWorkspacePage() {
  const [searchParams] = useSearchParams();

  // Status is controlled via query param, reflecting sidebar selection
  const rawStatusParam = searchParams.get('status') as ReviewTab | null;
  const activeTab: ReviewTab =
    rawStatusParam && STATUS_CONFIG[rawStatusParam] ? rawStatusParam : 'Submitted';

  // Search state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    searchParams.get('campaignId') || ''
  );
  const [selectedStandardGroup, setSelectedStandardGroup] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');

  // Specialized filters per tab
  const [submittedWaitingFilter, setSubmittedWaitingFilter] = useState<'all' | 'today' | 'over3' | 'over7'>('all');
  const [submittedSourceFilter, setSubmittedSourceFilter] = useState<'all' | 'initial' | 'resubmitted'>('all');
  const [revisionUserFilter, setRevisionUserFilter] = useState<'all' | 'mine'>('all');
  const [revisionStudentStatus, setRevisionStudentStatus] = useState<'all' | 'pending' | 'resubmitted'>('all');
  const [approvedTimeFilter, setApprovedTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [rejectedReasonCategory, setRejectedReasonCategory] = useState<string>('all');

  // Pagination on grouped students
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Campaigns list
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);

  // Selection state (nút tick ở đầu mỗi dòng)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals state
  const [viewingStudentGroup, setViewingStudentGroup] = useState<StudentEvidenceGroup | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingEvidence, setViewingEvidence] = useState<AdminEvidenceItem | null>(null);
  const [viewingAttachmentIndex, setViewingAttachmentIndex] = useState(0);

  const [quickReviewTarget, setQuickReviewTarget] = useState<AdminEvidenceItem | null>(null);
  const [detailAppId, setDetailAppId] = useState<string | null>(null);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mutations
  const { reviewEvidence } = useApplicationReviewMutations();

  // ── Resizable columns logic ──
  const [colWidths, setColWidths] = useState<Record<EvidenceColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<EvidenceColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ key: EvidenceColKey; startX: number; startW: number } | null>(null);
  const colWidthsRef = useRef(colWidths);
  colWidthsRef.current = colWidths;

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch {
      /* ignore */
    }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, key: EvidenceColKey) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = colWidthsRef.current[key];
      resizingRef.current = { key, startX, startW };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMove = (ev: MouseEvent) => {
        const cur = resizingRef.current;
        if (!cur) return;
        const delta = ev.clientX - cur.startX;
        const next = Math.max(MIN_COL_WIDTHS[cur.key], cur.startW + delta);
        setColWidths((prev) => (prev[cur.key] === next ? prev : { ...prev, [cur.key]: next }));
      };
      const onUp = () => {
        resizingRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    []
  );

  const ResizeHandle = ({ colKey }: { colKey: EvidenceColKey }) => (
    <span
      onMouseDown={(e) => onResizeStart(e, colKey)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setColWidths((prev) => ({ ...prev, [colKey]: DEFAULT_COL_WIDTHS[colKey] }));
      }}
      title="Kéo để đổi độ rộng cột (double-click để reset)"
      className="absolute top-0 right-0 h-full w-4 z-20 cursor-col-resize select-none touch-none group/resize flex items-center justify-center hover:bg-blue-500/10 transition-colors"
    >
      <span className="block h-4 w-px bg-[#C9CDD3] transition-colors group-hover/resize:bg-[#1683ff] group-hover/resize:w-[2px] group-active/resize:bg-[#1683ff]" />
    </span>
  );

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths]
  );

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load campaigns
  useEffect(() => {
    campaignService
      .getAll()
      .then((data) => setCampaigns(data))
      .catch(() => undefined);
  }, []);

  // Reset pageIndex when status tab changes
  useEffect(() => {
    setPageIndex(1);
    setSelected(new Set());
  }, [activeTab]);

  // Query Evidences from backend
  const queryParams = useMemo(() => {
    return {
      campaignId: selectedCampaignId || undefined,
      status: activeTab,
      pageIndex: 1,
      pageSize: 100, // Load đủ danh sách để nhóm theo sinh viên
    };
  }, [selectedCampaignId, activeTab]);

  const { data, isLoading, isError, refetch } = useEvidencesPaged(queryParams);

  const rawItems = data?.items ?? [];

  // Extract faculties for dropdown filter
  const faculties = useMemo(() => {
    const set = new Set<string>();
    rawItems.forEach((item) => {
      const snap = parseSnapshot(item.applicantSnapshotJson);
      if (snap.faculty) set.add(snap.faculty);
    });
    return Array.from(set);
  }, [rawItems]);

  // Client-side filtering combining specialized filters + common filters
  const filteredEvidences = useMemo(() => {
    return rawItems.filter((item) => {
      const snap = parseSnapshot(item.applicantSnapshotJson);
      const daysWaiting = getDaysDiff(item.createdAt);

      // Search match
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchName = snap.fullName?.toLowerCase().includes(q);
        const matchCode = snap.studentCode?.toLowerCase().includes(q);
        const matchEmail = snap.email?.toLowerCase().includes(q);
        const matchCriterion =
          item.criterionTitle?.toLowerCase().includes(q) ||
          item.criterionCode?.toLowerCase().includes(q);
        const matchAppCode = item.applicationCode?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchEmail && !matchCriterion && !matchAppCode) {
          return false;
        }
      }

      // Standard group filter
      if (selectedStandardGroup !== 'all') {
        const group = item.groupCode || item.criterionCode?.slice(0, 2);
        if (group && !group.toLowerCase().includes(selectedStandardGroup.toLowerCase())) {
          return false;
        }
      }

      // Faculty filter
      if (selectedFaculty !== 'all' && snap.faculty !== selectedFaculty) {
        return false;
      }

      // Specialized tab filters:
      if (activeTab === 'Submitted') {
        if (submittedWaitingFilter === 'today' && daysWaiting > 0) return false;
        if (submittedWaitingFilter === 'over3' && daysWaiting < 3) return false;
        if (submittedWaitingFilter === 'over7' && daysWaiting < 7) return false;

        if (submittedSourceFilter === 'resubmitted' && !item.reviewerNote) return false;
        if (submittedSourceFilter === 'initial' && item.reviewerNote) return false;
      }

      if (activeTab === 'Approved') {
        if (approvedTimeFilter !== 'all') {
          const daysApproved = getDaysDiff(item.reviewedAt || item.createdAt);
          if (approvedTimeFilter === 'today' && daysApproved > 0) return false;
          if (approvedTimeFilter === 'week' && daysApproved > 7) return false;
          if (approvedTimeFilter === 'month' && daysApproved > 30) return false;
        }
      }

      if (activeTab === 'Rejected') {
        if (rejectedReasonCategory !== 'all') {
          const note = (item.reviewerNote || '').toLowerCase();
          if (!note.includes(rejectedReasonCategory.toLowerCase())) return false;
        }
      }

      return true;
    });
  }, [
    rawItems,
    debouncedSearch,
    selectedStandardGroup,
    selectedFaculty,
    activeTab,
    submittedWaitingFilter,
    submittedSourceFilter,
    approvedTimeFilter,
    rejectedReasonCategory,
  ]);

  // Group evidences by Student
  const studentGroups: StudentEvidenceGroup[] = useMemo(() => {
    const map = new Map<string, StudentEvidenceGroup>();

    filteredEvidences.forEach((ev) => {
      const snap = parseSnapshot(ev.applicantSnapshotJson);
      const studentKey = snap.studentCode || ev.applicationId;

      if (!map.has(studentKey)) {
        map.set(studentKey, {
          key: studentKey,
          applicationId: ev.applicationId,
          applicationCode: ev.applicationCode,
          campaignId: ev.campaignId,
          campaignName: ev.campaignName,
          snapshot: snap,
          evidences: [],
          totalEvidences: 0,
          maxDaysWaiting: 0,
          isOver7Days: false,
          isOver3Days: false,
          standardGroups: [],
          latestSubmissionAt: ev.createdAt,
        });
      }

      const group = map.get(studentKey)!;
      group.evidences.push(ev);
      group.totalEvidences += 1;

      const daysWaiting = getDaysDiff(ev.createdAt);
      if (daysWaiting > group.maxDaysWaiting) {
        group.maxDaysWaiting = daysWaiting;
      }
      if (daysWaiting >= 7) group.isOver7Days = true;
      if (daysWaiting >= 3 && daysWaiting < 7) group.isOver3Days = true;

      const stdGroup = ev.groupCode || 'Ethics';
      if (!group.standardGroups.includes(stdGroup)) {
        group.standardGroups.push(stdGroup);
      }

      if (new Date(ev.createdAt).getTime() > new Date(group.latestSubmissionAt).getTime()) {
        group.latestSubmissionAt = ev.createdAt;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.maxDaysWaiting - a.maxDaysWaiting);
  }, [filteredEvidences]);

  // Keep viewingStudentGroup in sync when studentGroups update
  useEffect(() => {
    if (viewingStudentGroup) {
      const updated = studentGroups.find((g) => g.key === viewingStudentGroup.key);
      if (updated) {
        setViewingStudentGroup(updated);
      }
    }
  }, [studentGroups]);

  // Active filter count
  const activeFiltersCount =
    (selectedCampaignId ? 1 : 0) +
    (selectedStandardGroup !== 'all' ? 1 : 0) +
    (selectedFaculty !== 'all' ? 1 : 0) +
    (submittedWaitingFilter !== 'all' ? 1 : 0) +
    (submittedSourceFilter !== 'all' ? 1 : 0) +
    (revisionUserFilter !== 'all' ? 1 : 0) +
    (revisionStudentStatus !== 'all' ? 1 : 0) +
    (approvedTimeFilter !== 'all' ? 1 : 0) +
    (rejectedReasonCategory !== 'all' ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0);

  // Reset all filters
  const resetAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCampaignId('');
    setSelectedStandardGroup('all');
    setSelectedFaculty('all');
    setSubmittedWaitingFilter('all');
    setSubmittedSourceFilter('all');
    setRevisionUserFilter('all');
    setRevisionStudentStatus('all');
    setApprovedTimeFilter('all');
    setRejectedReasonCategory('all');
    setPageIndex(1);
    setSelected(new Set());
  };

  // Pagination calculation
  const totalStudents = studentGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages);
  const startIndex = (safePageIndex - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalStudents);
  const pagedStudents = studentGroups.slice(startIndex, endIndex);

  const rangeFrom = totalStudents === 0 ? 0 : startIndex + 1;
  const rangeTo = endIndex;
  const canPrev = safePageIndex <= 1;
  const canNext = safePageIndex >= totalPages;

  const handlePageSizeChange = (val: string) => {
    const size = Number(val) || DEFAULT_PAGE_SIZE;
    setPageSize(size);
    setPageIndex(1);
  };

  // Selection helpers (nút tick)
  const allChecked =
    pagedStudents.length > 0 && pagedStudents.every((g) => selected.has(g.key));
  const isIndeterminate =
    pagedStudents.length > 0 &&
    pagedStudents.some((g) => selected.has(g.key)) &&
    !allChecked;

  const toggleAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      pagedStudents.forEach((g) => {
        if (checked) next.add(g.key);
        else next.delete(g.key);
      });
      return next;
    });
  };

  const toggleOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Handle single evidence review submit
  const handleQuickReviewSubmit = async (
    decision: 'Approved' | 'Rejected' | 'NeedsRevision',
    note: string
  ) => {
    if (!quickReviewTarget) return;
    try {
      await reviewEvidence.mutateAsync({
        id: quickReviewTarget.id,
        body: {
          decision,
          note: note || null,
          rowVersion: quickReviewTarget.rowVersion,
        },
      });
      setToastMessage({
        type: 'success',
        text:
          decision === 'Approved'
            ? 'Đã duyệt đạt tiêu chí thành công!'
            : decision === 'NeedsRevision'
            ? 'Đã gửi yêu cầu bổ sung minh chứng tới sinh viên!'
            : 'Đã từ chối minh chứng!',
      });
      setTimeout(() => setToastMessage(null), 3500);
      setQuickReviewTarget(null);
      void refetch();
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: sanitizeApiError(err) });
    }
  };

  // Quick One-Click Approve
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
      setToastMessage({
        type: 'success',
        text: `Đã duyệt đạt tiêu chí [${item.criterionCode}] cho sinh viên!`,
      });
      setTimeout(() => setToastMessage(null), 3000);
      void refetch();
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: sanitizeApiError(err) });
    }
  };

  // Quick One-Click Revert back to Submitted
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
      setToastMessage({
        type: 'success',
        text: `Đã hoàn lại tiêu chí về trạng thái chờ thẩm định!`,
      });
      setTimeout(() => setToastMessage(null), 3000);
      void refetch();
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: sanitizeApiError(err) });
    }
  };

  const handleOpenViewer = (item: AdminEvidenceItem, attIndex = 0) => {
    setViewingEvidence(item);
    setViewingAttachmentIndex(attIndex);
    setViewerOpen(true);
  };

  const currentStatusConf = STATUS_CONFIG[activeTab];

  // Stats calculation
  const urgentCount = studentGroups.filter((g) => g.isOver7Days).length;
  const warningCount = studentGroups.filter((g) => g.isOver3Days && !g.isOver7Days).length;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-10 font-inter font-['Inter',_sans-serif] text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-500/10'
                : 'bg-rose-50 text-rose-900 border-rose-200 shadow-rose-500/10'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title={`Thẩm định minh chứng — ${currentStatusConf.label}`}
        description={`${currentStatusConf.description}. Tra cứu và duyệt minh chứng theo từng sinh viên.`}
        actions={
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg font-medium">
                Đã tick chọn: <strong>{selected.size}</strong> sinh viên
              </span>
            )}
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#a6cffb] text-[#244a7d] text-xs font-normal shadow-xs hover:bg-[#8fbff9] hover:text-[#1a3a65] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer"
            >
              <RefreshCw size={13} strokeWidth={1.8} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: Users,
            label: 'Tổng sinh viên',
            value: totalStudents.toLocaleString('vi-VN'),
            color: 'text-blue-600 bg-blue-50',
          },
          {
            icon: FileCheck2,
            label: `Minh chứng ${currentStatusConf.label.toLowerCase()}`,
            value: filteredEvidences.length.toLocaleString('vi-VN'),
            color: 'text-indigo-600 bg-indigo-50',
          },
          {
            icon: Clock,
            label: 'Cảnh báo chờ >3 ngày',
            value: warningCount.toLocaleString('vi-VN'),
            color: 'text-amber-600 bg-amber-50',
          },
          {
            icon: ShieldAlert,
            label: 'Quá hạn >7 ngày',
            value: urgentCount.toLocaleString('vi-VN'),
            color: 'text-rose-600 bg-rose-50',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
              <item.icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-600 font-medium truncate">{item.label}</div>
              <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Unified Card: Filter + Table + Pagination */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        {/* Zone 1: Filter toolbar */}
        <div className="px-3 sm:px-4 pt-2.5 pb-2.5 space-y-2 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
            {/* Search */}
            <div className="relative w-full lg:w-[42%] lg:max-w-[460px] shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm theo họ tên, MSSV, tiêu chí, email..."
                  className="w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-8 pr-8 py-0 text-[12px] leading-9 font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none transition-colors shadow-2xs"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter selectors */}
            <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2 flex-wrap">
              {/* Chiến dịch selector */}
              <div className="relative w-full sm:w-[170px] shrink-0">
                <select
                  value={selectedCampaignId}
                  onChange={(e) => {
                    setSelectedCampaignId(e.target.value);
                    setPageIndex(1);
                  }}
                  className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="">Tất cả chiến dịch</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.schoolYear})
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* 5 Tiêu chuẩn selector */}
              <div className="relative w-full sm:w-[155px] shrink-0">
                <select
                  value={selectedStandardGroup}
                  onChange={(e) => {
                    setSelectedStandardGroup(e.target.value);
                    setPageIndex(1);
                  }}
                  className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="all">5 Tiêu chuẩn: Tất cả</option>
                  <option value="Ethics">Đạo đức tốt</option>
                  <option value="Study">Học tập tốt</option>
                  <option value="Fitness">Thể lực tốt</option>
                  <option value="Volunteer">Tình nguyện tốt</option>
                  <option value="Integration">Hội nhập tốt</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Khoa/Viện selector */}
              <div className="relative w-full sm:w-[145px] shrink-0">
                <select
                  value={selectedFaculty}
                  onChange={(e) => {
                    setSelectedFaculty(e.target.value);
                    setPageIndex(1);
                  }}
                  className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="all">Tất cả khoa / viện</option>
                  {faculties.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Bộ lọc chuyên biệt cho từng tab */}
              {activeTab === 'Submitted' && (
                <div className="relative w-full sm:w-[140px] shrink-0">
                  <select
                    value={submittedWaitingFilter}
                    onChange={(e) => {
                      setSubmittedWaitingFilter(e.target.value as any);
                      setPageIndex(1);
                    }}
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="all">Thời gian: Tất cả</option>
                    <option value="today">Hôm nay</option>
                    <option value="over3">Quá 3 ngày</option>
                    <option value="over7">Quá 7 ngày</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}

              {activeTab === 'NeedsRevision' && (
                <div className="relative w-full sm:w-[150px] shrink-0">
                  <select
                    value={revisionStudentStatus}
                    onChange={(e) => {
                      setRevisionStudentStatus(e.target.value as any);
                      setPageIndex(1);
                    }}
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="all">Tình trạng: Tất cả</option>
                    <option value="pending">Chưa cập nhật lại</option>
                    <option value="resubmitted">Đã nộp lại chờ duyệt</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}

              {activeTab === 'Approved' && (
                <div className="relative w-full sm:w-[140px] shrink-0">
                  <select
                    value={approvedTimeFilter}
                    onChange={(e) => {
                      setApprovedTimeFilter(e.target.value as any);
                      setPageIndex(1);
                    }}
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="all">Duyệt: Tất cả</option>
                    <option value="today">Hôm nay</option>
                    <option value="week">Tuần này</option>
                    <option value="month">Tháng này</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}

              {activeTab === 'Rejected' && (
                <div className="relative w-full sm:w-[155px] shrink-0">
                  <select
                    value={rejectedReasonCategory}
                    onChange={(e) => {
                      setRejectedReasonCategory(e.target.value);
                      setPageIndex(1);
                    }}
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="all">Lý do: Tất cả</option>
                    <option value="năm học">Không đúng năm học</option>
                    <option value="hợp lệ">Không hợp lệ</option>
                    <option value="mờ">Mờ / thiếu dấu mộc</option>
                    <option value="danh mục">Ngoài danh mục</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}

              {/* Nút reset filter */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="h-9 px-2.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Đặt lại tất cả bộ lọc"
                >
                  <X size={12} />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-[11px] font-normal text-slate-500 mr-0.5">Đang lọc:</span>

              {debouncedSearch.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-600 font-normal text-[11px]">
                  "{debouncedSearch}"
                  <button type="button" onClick={() => setSearch('')} className="hover:text-rose-600 cursor-pointer">
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedCampaignId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                  Chiến dịch: {campaigns.find((c) => c.id === selectedCampaignId)?.name || 'Đã chọn'}
                  <button type="button" onClick={() => setSelectedCampaignId('')} className="hover:text-rose-600 cursor-pointer">
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedStandardGroup !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                  Tiêu chuẩn: {STANDARD_GROUPS[selectedStandardGroup]?.label || selectedStandardGroup}
                  <button type="button" onClick={() => setSelectedStandardGroup('all')} className="hover:text-rose-600 cursor-pointer">
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedFaculty !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                  Khoa: {selectedFaculty}
                  <button type="button" onClick={() => setSelectedFaculty('all')} className="hover:text-rose-600 cursor-pointer">
                    <X size={11} />
                  </button>
                </span>
              )}

              {activeTab === 'Submitted' && submittedWaitingFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50/80 text-amber-700 font-normal text-[11px] border border-amber-200">
                  Chờ: {submittedWaitingFilter === 'today' ? 'Hôm nay' : submittedWaitingFilter === 'over3' ? 'Quá 3 ngày' : 'Quá 7 ngày'}
                  <button type="button" onClick={() => setSubmittedWaitingFilter('all')} className="hover:text-rose-600 cursor-pointer">
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Short divider */}
        <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
        </div>

        {/* Zone 2: Table Section - Có kéo thả kích thước cột pixel-perfect */}
        <div className="overflow-x-auto custom-scrollbar">
          <table
            className="tbl-div border-collapse text-xs table-fixed"
            style={{ width: `${totalTableWidth}px` }}
          >
            <colgroup>
              {(Object.keys(DEFAULT_COL_WIDTHS) as EvidenceColKey[]).map((k) => (
                <col key={k} style={{ width: `${colWidths[k]}px` }} />
              ))}
            </colgroup>

            {/* Table Header: neutral gray (#ECEDEF) với vạch | kéo thả */}
            <thead>
              <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
                {/* 1. Nút tick ở đầu */}
                <th
                  className="relative px-3 py-3.5 text-center select-none"
                  style={{ width: `${colWidths.check}px` }}
                >
                  <input
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                    aria-label="Chọn tất cả sinh viên"
                  />
                  <ResizeHandle colKey="check" />
                </th>

                {/* 2. STT */}
                <th
                  className="relative px-2 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.stt}px` }}
                >
                  <span className="block truncate">STT</span>
                  <ResizeHandle colKey="stt" />
                </th>

                {/* 3. Sinh viên */}
                <th
                  className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.student}px` }}
                >
                  <span className="block truncate">Sinh viên</span>
                  <ResizeHandle colKey="student" />
                </th>

                {/* 4. Mã SV */}
                <th
                  className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.studentCode}px` }}
                >
                  <span className="block truncate">Mã SV</span>
                  <ResizeHandle colKey="studentCode" />
                </th>

                {/* 5. Email */}
                <th
                  className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.email}px` }}
                >
                  <span className="block truncate">Email</span>
                  <ResizeHandle colKey="email" />
                </th>

                {/* 6. Lớp */}
                <th
                  className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.class}px` }}
                >
                  <span className="block truncate">Lớp</span>
                  <ResizeHandle colKey="class" />
                </th>

                {/* 7. Khoa */}
                <th
                  className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.faculty}px` }}
                >
                  <span className="block truncate">Khoa</span>
                  <ResizeHandle colKey="faculty" />
                </th>

                {/* 8. Chiến dịch */}
                <th
                  className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.campaign}px` }}
                >
                  <span className="block truncate">Chiến dịch</span>
                  <ResizeHandle colKey="campaign" />
                </th>

                {/* 9. Tiêu chuẩn */}
                <th
                  className="relative px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.standards}px` }}
                >
                  <span className="block truncate">Tiêu chuẩn</span>
                  <ResizeHandle colKey="standards" />
                </th>

                {/* 10. Minh chứng */}
                <th
                  className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.evidenceCount}px` }}
                >
                  <span className="block truncate">Minh chứng</span>
                  <ResizeHandle colKey="evidenceCount" />
                </th>

                {/* 11. Thời gian */}
                <th
                  className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.submittedAt}px` }}
                >
                  <span className="block truncate">Thời gian</span>
                  <ResizeHandle colKey="submittedAt" />
                </th>

                {/* 12. Quá hạn */}
                <th
                  className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.overdue}px` }}
                >
                  <span className="block truncate">Quá hạn</span>
                  <ResizeHandle colKey="overdue" />
                </th>

                {/* 13. Thao tác */}
                <th
                  className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap"
                  style={{ width: `${colWidths.actions}px` }}
                >
                  <span className="block truncate">Thao tác</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#eef2f6]">
              {isLoading ? (
                <EvidenceTableSkeleton rowCount={Math.min(pageSize, 8)} />
              ) : isError ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-rose-600">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <span className="text-xs font-bold block">Không thể tải dữ liệu minh chứng</span>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs cursor-pointer hover:bg-blue-700"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : pagedStudents.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 size={24} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 block">
                      Không có sinh viên nào trong trạng thái "{currentStatusConf.label}"
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tất cả minh chứng đã được xử lý hoặc không có bản ghi phù hợp bộ lọc.
                    </span>
                  </td>
                </tr>
              ) : (
                pagedStudents.map((group, idx) => {
                  const snap = group.snapshot;
                  const rowNumber = startIndex + idx + 1;
                  const isChecked = selected.has(group.key);

                  return (
                    <tr
                      key={group.key}
                      onClick={() => setViewingStudentGroup(group)}
                      className={`transition-colors cursor-pointer select-none border-b border-[#eef2f6] ${
                        isChecked ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-[#f3f8ff]'
                      }`}
                    >
                      {/* 1. Nút tick */}
                      <td
                        className="py-3 px-3 text-center align-middle cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOne(group.key);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(group.key)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                          aria-label={`Chọn sinh viên ${snap.fullName || ''}`}
                        />
                      </td>

                      {/* 2. STT */}
                      <td className="py-3 px-2 text-center font-mono text-[11px] text-slate-500 align-middle">
                        {rowNumber}
                      </td>

                      {/* 3. Sinh viên: hiện đầy đủ họ tên rõ ràng */}
                      <td className="py-3 px-3 align-middle overflow-hidden">
                        <div
                          className="font-medium text-slate-900 text-xs truncate"
                          title={snap.fullName || 'Sinh viên'}
                        >
                          {snap.fullName || '—'}
                        </div>
                      </td>

                      {/* 4. Mã SV riêng */}
                      <td className="py-3 px-3 align-middle overflow-hidden">
                        <span
                          className="font-mono text-xs text-slate-700 block truncate"
                          title={snap.studentCode || ''}
                        >
                          {snap.studentCode || '—'}
                        </span>
                      </td>

                      {/* 5. Email riêng */}
                      <td className="py-3 px-3 align-middle overflow-hidden text-slate-700">
                        <div className="text-xs text-slate-800 truncate" title={snap.email || ''}>
                          {snap.email || '—'}
                        </div>
                      </td>

                      {/* 6. Lớp riêng */}
                      <td className="py-3 px-3 align-middle overflow-hidden text-slate-700">
                        <div className="text-xs text-slate-700 truncate" title={snap.administrativeClass || ''}>
                          {snap.administrativeClass || '—'}
                        </div>
                      </td>

                      {/* 7. Khoa riêng */}
                      <td className="py-3 px-3 align-middle overflow-hidden text-slate-700">
                        <div className="text-xs text-slate-700 truncate" title={snap.faculty || ''}>
                          {snap.faculty || '—'}
                        </div>
                      </td>

                      {/* 8. Chiến dịch */}
                      <td className="py-3 px-3 align-middle text-slate-700 overflow-hidden">
                        <div
                          className="truncate font-medium text-xs text-slate-800"
                          title={group.campaignName}
                        >
                          {group.campaignName || '—'}
                        </div>
                      </td>

                      {/* 9. Tiêu chuẩn: đầy đủ chữ, không background icon */}
                      <td className="py-3 px-3 align-middle overflow-hidden">
                        <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap">
                          {group.standardGroups.map((grp) => {
                            const std = STANDARD_GROUPS[grp] || STANDARD_GROUPS.Ethics;
                            const Icon = std.icon;
                            return (
                              <span
                                key={grp}
                                title={std.label}
                                className={`inline-flex items-center gap-1 text-[11px] font-medium ${std.color}`}
                              >
                                <Icon size={12} className="shrink-0" />
                                <span>{std.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* 10. Minh chứng: xóa background badge */}
                      <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-700">
                          {group.totalEvidences} minh chứng
                        </span>
                      </td>

                      {/* 11. Thời gian nộp */}
                      <td className="py-3 px-3 text-center align-middle whitespace-nowrap text-slate-600 text-xs">
                        {formatTimeAgo(group.latestSubmissionAt)}
                      </td>

                      {/* 12. Quá hạn: bỏ icon, background bo tròn viên thuốc pill đẹp */}
                      <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                        {activeTab === 'Submitted' ? (
                          group.isOver7Days ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                              Quá hạn {group.maxDaysWaiting} ngày
                            </span>
                          ) : group.isOver3Days ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                              Chờ {group.maxDaysWaiting} ngày
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                              Đúng hạn
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* 13. Thao tác: nút xem bo góc viên thuốc pill đẹp mắt */}
                      <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingStudentGroup(group);
                          }}
                          className="h-7.5 px-3.5 rounded-full text-xs font-medium bg-[#e8f3ff] text-[#0866db] hover:bg-[#1683ff] hover:text-white hover:border-[#1683ff] border border-[#cbe1fc] shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.96]"
                          title="Xem chi tiết minh chứng trong popup"
                        >
                          <Eye size={13} strokeWidth={1.8} />
                          <span>Xem</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Zone 3: Pagination Footer */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500 border-t border-[#eef2f6]">
          <span className="font-normal">
            Tổng số: <span className="font-semibold text-slate-700">{totalStudents}</span> sinh viên ({filteredEvidences.length} minh chứng)
          </span>

          <div className="flex-1" />

          {/* Page size selector */}
          <label className="inline-flex items-center gap-1.5 font-normal">
            Số dòng/trang
            <span className="relative inline-flex items-center">
              <select
                value={String(pageSize)}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="appearance-none h-7 pl-2.5 pr-7 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-600 cursor-pointer hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </span>
          </label>

          {/* Range count */}
          <span className="font-medium text-slate-600 tabular-nums whitespace-nowrap">
            {rangeFrom} - {rangeTo}
          </span>

          {/* Navigation buttons */}
          <div className="inline-flex items-center gap-0.5">
            <button
              type="button"
              disabled={canPrev}
              onClick={() => setPageIndex(1)}
              title="Trang đầu"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronsLeft size={13} />
            </button>
            <button
              type="button"
              disabled={canPrev}
              onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
              title="Trang trước"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              disabled={canNext}
              onClick={() => setPageIndex((p) => p + 1)}
              title="Trang sau"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight size={13} />
            </button>
            <button
              type="button"
              disabled={canNext}
              onClick={() => setPageIndex(totalPages)}
              title="Trang cuối"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronsRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Student Evidence Group Popup Modal */}
      <StudentEvidenceGroupModal
        isOpen={Boolean(viewingStudentGroup)}
        group={viewingStudentGroup}
        onClose={() => setViewingStudentGroup(null)}
        onOpenViewer={handleOpenViewer}
        onDirectApprove={handleDirectApprove}
        onDirectRevert={handleDirectRevert}
        onOpenReview={(item) => setQuickReviewTarget(item)}
        onOpenFullApp={(appId) => setDetailAppId(appId)}
        isApproving={reviewEvidence.isPending}
      />

      {/* Evidence Viewer Modal */}
      <EvidenceViewerModal
        isOpen={viewerOpen}
        evidence={viewingEvidence}
        initialAttachmentIndex={viewingAttachmentIndex}
        onClose={() => {
          setViewerOpen(false);
          setViewingEvidence(null);
        }}
      />

      {/* Quick Evidence Review Modal */}
      <EvidenceReviewQuickModal
        isOpen={Boolean(quickReviewTarget)}
        evidence={quickReviewTarget}
        isLoading={reviewEvidence.isPending}
        onClose={() => setQuickReviewTarget(null)}
        onSubmit={handleQuickReviewSubmit}
      />

      {/* Full Application Detail Modal */}
      {detailAppId && (
        <ApplicationDetailModal
          isOpen={Boolean(detailAppId)}
          applicationId={detailAppId}
          onClose={() => setDetailAppId(null)}
          onSuccessDecision={() => {
            void refetch();
          }}
        />
      )}
    </div>
  );
}
