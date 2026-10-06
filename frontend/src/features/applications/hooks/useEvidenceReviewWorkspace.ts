import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApplicationReviewMutations, useEvidencesPaged } from './useApplications';
import { campaignService } from '../../campaigns/services/campaign.service';
import type { CampaignResponse } from '../../campaigns/types/campaign.types';
import {
  parseApplicantSnapshot,
  type AdminEvidenceItem,
  type StudentEvidenceGroup,
} from '../types/application.types';

export type ReviewTab = 'Submitted' | 'NeedsRevision' | 'Approved' | 'Rejected';

const DEFAULT_PAGE_SIZE = 12;

function getDaysDiff(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const created = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

export function useEvidenceReviewWorkspace() {
  const [searchParams] = useSearchParams();

  const rawStatusParam = searchParams.get('status') as ReviewTab | null;
  const activeTab: ReviewTab =
    rawStatusParam && ['Submitted', 'NeedsRevision', 'Approved', 'Rejected'].includes(rawStatusParam)
      ? rawStatusParam
      : 'Submitted';

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

  // Selection state
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
      pageSize: 100,
    };
  }, [selectedCampaignId, activeTab]);

  const { data, isLoading, isError, refetch } = useEvidencesPaged(queryParams);
  const rawItems = data?.items ?? [];

  // Extract faculties for dropdown filter
  const faculties = useMemo(() => {
    const set = new Set<string>();
    rawItems.forEach((item) => {
      const snap = parseApplicantSnapshot(item.applicantSnapshotJson);
      if (snap.faculty) set.add(snap.faculty);
    });
    return Array.from(set);
  }, [rawItems]);

  // Client-side filtering
  const filteredEvidences = useMemo(() => {
    return rawItems.filter((item) => {
      const snap = parseApplicantSnapshot(item.applicantSnapshotJson);
      const daysWaiting = getDaysDiff(item.createdAt);

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

      if (selectedStandardGroup !== 'all') {
        const group = item.groupCode || item.criterionCode?.slice(0, 2);
        if (group && !group.toLowerCase().includes(selectedStandardGroup.toLowerCase())) {
          return false;
        }
      }

      if (selectedFaculty !== 'all' && snap.faculty !== selectedFaculty) {
        return false;
      }

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
      const snap = parseApplicantSnapshot(ev.applicantSnapshotJson);
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

  // Keep viewingStudentGroup in sync
  useEffect(() => {
    if (viewingStudentGroup) {
      const updated = studentGroups.find((g) => g.key === viewingStudentGroup.key);
      if (updated) {
        setViewingStudentGroup(updated);
      }
    }
  }, [studentGroups, viewingStudentGroup]);

  // Active filter count
  const activeFiltersCount =
    (selectedCampaignId ? 1 : 0) +
    (selectedStandardGroup !== 'all' ? 1 : 0) +
    (selectedFaculty !== 'all' ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0) +
    (activeTab === 'Submitted' && submittedWaitingFilter !== 'all' ? 1 : 0) +
    (activeTab === 'Submitted' && submittedSourceFilter !== 'all' ? 1 : 0) +
    (activeTab === 'NeedsRevision' && revisionUserFilter !== 'all' ? 1 : 0) +
    (activeTab === 'NeedsRevision' && revisionStudentStatus !== 'all' ? 1 : 0) +
    (activeTab === 'Approved' && approvedTimeFilter !== 'all' ? 1 : 0) +
    (activeTab === 'Rejected' && rejectedReasonCategory !== 'all' ? 1 : 0);

  // Pagination for grouped rows
  const totalStudents = studentGroups.length;
  const totalPages = Math.ceil(totalStudents / pageSize) || 1;
  const pagedStudentGroups = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return studentGroups.slice(start, start + pageSize);
  }, [studentGroups, pageIndex, pageSize]);

  // Selection handlers
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(pagedStudentGroups.map((g) => g.key)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleSelectOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Direct approve one item
  const handleDirectApprove = async (item: AdminEvidenceItem) => {
    try {
      await reviewEvidence.mutateAsync({
        id: item.id,
        body: {
          decision: 'Approved',
          note: null,
          rowVersion: item.rowVersion,
        },
      });
      setToastMessage({ type: 'success', text: `Đã duyệt minh chứng "${item.criterionTitle}".` });
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage({ type: 'error', text: 'Có lỗi xảy ra khi phê duyệt minh chứng.' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Direct revert to Submitted
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
      setToastMessage({ type: 'success', text: `Đã hoàn lại minh chứng về trạng thái Chờ duyệt.` });
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage({ type: 'error', text: 'Có lỗi xảy ra khi hoàn lại trạng thái.' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Review evidence with decision and note
  const handleReviewEvidence = async (
    item: AdminEvidenceItem,
    decision: 'Approved' | 'Rejected' | 'NeedsRevision',
    note?: string | null
  ) => {
    try {
      await reviewEvidence.mutateAsync({
        id: item.id,
        body: {
          decision,
          note: note ?? null,
          rowVersion: item.rowVersion,
        },
      });
      setToastMessage({
        type: 'success',
        text: `Đã cập nhật trạng thái minh chứng "${item.criterionTitle}".`,
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật minh chứng.' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Batch approve selected students
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const handleBatchApprove = async () => {
    if (selected.size === 0) return;
    setIsBatchApproving(true);
    let successCount = 0;

    const evidencesToApprove = studentGroups
      .filter((g) => selected.has(g.key))
      .flatMap((g) => g.evidences);

    for (const ev of evidencesToApprove) {
      try {
        await reviewEvidence.mutateAsync({
          id: ev.id,
          body: {
            decision: 'Approved',
            note: 'Phê duyệt hàng loạt',
            rowVersion: ev.rowVersion,
          },
        });
        successCount += 1;
      } catch {
        // continue
      }
    }

    setIsBatchApproving(false);
    setSelected(new Set());
    setToastMessage({
      type: 'success',
      text: `Đã phê duyệt thành công ${successCount} minh chứng của ${selected.size} sinh viên.`,
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenViewer = (item: AdminEvidenceItem, attachmentIndex = 0) => {
    setViewingEvidence(item);
    setViewingAttachmentIndex(attachmentIndex);
    setViewerOpen(true);
  };

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

  return {
    activeTab,
    campaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    search,
    setSearch,
    debouncedSearch,
    faculties,
    selectedFaculty,
    setSelectedFaculty,
    selectedStandardGroup,
    setSelectedStandardGroup,

    // Specialized filters
    submittedWaitingFilter,
    setSubmittedWaitingFilter,
    submittedSourceFilter,
    setSubmittedSourceFilter,
    revisionUserFilter,
    setRevisionUserFilter,
    revisionStudentStatus,
    setRevisionStudentStatus,
    approvedTimeFilter,
    setApprovedTimeFilter,
    rejectedReasonCategory,
    setRejectedReasonCategory,

    activeFiltersCount,
    resetAllFilters,

    // Data & pagination
    isLoading,
    isError,
    refetch,
    rawItems,
    studentGroups,
    pagedStudentGroups,
    totalStudents,
    totalPages,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,

    // Selection
    selected,
    toggleSelectAll,
    toggleSelectOne,

    // Handlers
    handleDirectApprove,
    handleDirectRevert,
    handleReviewEvidence,
    handleBatchApprove,
    isBatchApproving,

    // Modals
    viewingStudentGroup,
    setViewingStudentGroup,
    viewerOpen,
    setViewerOpen,
    viewingEvidence,
    setViewingEvidence,
    viewingAttachmentIndex,
    handleOpenViewer,
    quickReviewTarget,
    setQuickReviewTarget,
    detailAppId,
    setDetailAppId,

    // Toast
    toastMessage,
    setToastMessage,
  };
}
