import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApplicationsPaged } from './useApplications';
import { campaignService } from '../../campaigns/services/campaign.service';
import type { CampaignResponse } from '../../campaigns/types/campaign.types';
import {
  normalizeApplicationStatus,
  parseApplicantSnapshot,
  type ApplicantSnapshot,
  type ReviewApplicationFilterParams,
} from '../types/application.types';

const DEFAULT_PAGE_SIZE = 12;

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function useApplicationList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedStatus = normalizeApplicationStatus(searchParams.get('status'));

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    searchParams.get('campaignId') || ''
  );

  // Pagination
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const setSelectedStatus = (status: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (status) next.set('status', status);
      else next.delete('status');
      return next;
    });
    setPageIndex(1);
  };

  // Campaigns list for dropdown
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);

  // Selection & Modal
  const [selectedAppId, setSelectedAppId] = useState<string | null>(
    searchParams.get('id') || null
  );
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync with searchParams on mount or param change
  useEffect(() => {
    const cId = searchParams.get('campaignId');
    const id = searchParams.get('id');

    if (cId && cId !== selectedCampaignId) setSelectedCampaignId(cId);
    if (id && id !== selectedAppId) setSelectedAppId(id);
  }, [searchParams]);

  // Load campaigns
  useEffect(() => {
    campaignService
      .getAll()
      .then((data) => setCampaigns(data))
      .catch(() => undefined);
  }, []);

  // Filter params for query
  const queryParams: ReviewApplicationFilterParams = useMemo(() => {
    return {
      campaignId: selectedCampaignId || undefined,
      status: selectedStatus || undefined,
      pageIndex,
      pageSize,
    };
  }, [selectedCampaignId, selectedStatus, pageIndex, pageSize]);

  const { data, isPending, isError, error, refetch } = useApplicationsPaged(queryParams);

  const rawItems = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  // Client-side filtering by search term
  const items = useMemo(() => {
    if (!debouncedSearch.trim()) return rawItems;
    const q = debouncedSearch.toLowerCase().trim();

    return rawItems.filter((app) => {
      const snapshot: ApplicantSnapshot = parseApplicantSnapshot(app.applicantSnapshotJson);
      const matchName = snapshot.fullName?.toLowerCase().includes(q);
      const matchCode = snapshot.studentCode?.toLowerCase().includes(q);
      const matchClass = snapshot.administrativeClass?.toLowerCase().includes(q);
      const matchFaculty = snapshot.faculty?.toLowerCase().includes(q);
      const matchEmail = snapshot.email?.toLowerCase().includes(q);
      const matchCampaign = app.campaignName?.toLowerCase().includes(q);

      return matchName || matchCode || matchClass || matchFaculty || matchEmail || matchCampaign;
    });
  }, [rawItems, debouncedSearch]);

  // Quick stats
  const stats = useMemo(() => {
    const submittedCount = rawItems.filter(
      (i) => i.status === 'Submitted' || i.status === 'Resubmitted'
    ).length;
    const approvedAll5Count = rawItems.filter(
      (i) => (i.standards?.filter((s) => s.complete).length ?? 0) === 5
    ).length;

    return {
      total: totalCount,
      submitted: submittedCount,
      approvedAll5: approvedAll5Count,
    };
  }, [rawItems, totalCount]);

  // Row selection
  const allChecked = items.length > 0 && selectedRowIds.size === items.length;
  const isIndeterminate = items.length > 0 && selectedRowIds.size > 0 && !allChecked;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(new Set(items.map((i) => i.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Pagination helper metrics
  const effectivePageSize = data?.pageSize ?? pageSize;
  const effectivePageIndex = data?.pageIndex ?? pageIndex;
  const rangeFrom = totalCount === 0 ? 0 : (effectivePageIndex - 1) * effectivePageSize + 1;
  const rangeTo = Math.min(effectivePageIndex * effectivePageSize, totalCount);

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setPageIndex(1);
  };

  const canPrev = effectivePageIndex <= 1;
  const canNext = totalPages <= 1 ? false : effectivePageIndex >= totalPages;

  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (campaignId) next.set('campaignId', campaignId);
      else next.delete('campaignId');
      return next;
    });
    setPageIndex(1);
  };

  const resetAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCampaignId('');
    setSelectedStatus('');
    setPageIndex(1);
    setSelectedRowIds(new Set());
  };

  const exportCsv = () => {
    const rows = items.filter((i) => (selectedRowIds.size ? selectedRowIds.has(i.id) : true));
    if (!rows.length) {
      setBanner({ ok: false, msg: 'Không có dữ liệu để xuất.' });
      return;
    }

    const head = ['Ma ho so', 'Ho ten', 'MSSV', 'Lop', 'Khoa', 'Dot xet', 'Trang thai', 'Ngay nop'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [head.join(',')].concat(
      rows.map((r) => {
        const snap = parseApplicantSnapshot(r.applicantSnapshotJson);
        return [
          esc(r.applicationCode),
          esc(snap.fullName),
          esc(snap.studentCode),
          esc(snap.administrativeClass),
          esc(snap.faculty),
          esc(r.campaignName),
          esc(r.status),
          esc(fmtDate(r.submittedAt)),
        ].join(',');
      })
    );

    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-ho-so-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setBanner({ ok: true, msg: `Đã xuất ${rows.length} hồ sơ ra CSV.` });
  };

  return {
    items,
    totalCount,
    totalPages,
    isPending,
    isError,
    error,
    refetch,

    stats,
    campaigns,

    // Filters
    search,
    setSearch,
    debouncedSearch,
    selectedCampaignId,
    handleCampaignChange,
    selectedStatus,
    setSelectedStatus,
    resetAllFilters,

    // Pagination
    pageIndex,
    setPageIndex,
    pageSize,
    handlePageSizeChange,
    effectivePageIndex,
    effectivePageSize,
    rangeFrom,
    rangeTo,
    canPrev,
    canNext,

    // Selection
    selectedRowIds,
    setSelectedRowIds,
    allChecked,
    isIndeterminate,
    toggleSelectAll,
    toggleSelectRow,

    // Modals
    selectedAppId,
    setSelectedAppId,

    // Banner
    banner,
    setBanner,

    exportCsv,
  };
}
