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
  Download,
  Eye,
  FileText,
  HeartHandshake,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { useApplicationsPaged } from '../../hooks/admin/useApplicationReview';
import { campaignService } from '../../services/admin/campaignService';
import type { CampaignResponse } from '../../types/admin/campaign';
import type {
  ApplicantSnapshot,
  ReviewApplicationFilterParams,
} from '../../types/admin/application';
import { ApplicationDetailModal } from '../../components/admin/applications/ApplicationDetailModal';
import { sanitizeApiError } from '../../services/apiErrorSanitizer';

const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const normalizeApplicationStatus = (status: string | null): string => {
  if (!status) return '';
  const s = status.toLowerCase();
  const statuses: Record<string, string> = {
    pending: 'Submitted',
    submitted: 'Submitted',
    resubmitted: 'Resubmitted',
    needsrevision: 'NeedsRevision',
    underreview: 'UnderReview',
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };
  return statuses[s] ?? '';
};

const APPLICATION_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  Draft: { label: 'Bản nháp', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' },
  Submitted: { label: 'Đã nộp', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  UnderReview: { label: 'Đang thẩm định', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' },
  NeedsRevision: { label: 'Cần bổ sung', bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-amber-200' },
  Resubmitted: { label: 'Đã nộp lại', bg: 'bg-cyan-50', text: 'text-cyan-800', dot: 'bg-cyan-500', border: 'border-cyan-200' },
  Approved: { label: 'Đã duyệt', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  Rejected: { label: 'Từ chối', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' },
  Withdrawn: { label: 'Đã rút', bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400', border: 'border-slate-200' },
};

const GROUP_ICONS: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  Ethics: { label: 'Đạo đức tốt', icon: ShieldCheck },
  Study: { label: 'Học tập tốt', icon: BookOpen },
  Fitness: { label: 'Thể lực tốt', icon: Zap },
  Volunteer: { label: 'Tình nguyện tốt', icon: HeartHandshake },
  Integration: { label: 'Hội nhập tốt', icon: Scale },
};

// ── Resizable columns (Excel-like): lưu width từng cột, kéo ở mép phải header ──
type AppColKey =
  | 'check'
  | 'stt'
  | 'fullname'
  | 'studentcode'
  | 'class'
  | 'faculty'
  | 'campaign'
  | 'standards'
  | 'submittedAt'
  | 'status'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<AppColKey, number> = {
  check: 44,
  stt: 50,
  fullname: 180,
  studentcode: 110,
  class: 100,
  faculty: 150,
  campaign: 180,
  standards: 160,
  submittedAt: 110,
  status: 110,
  actions: 90,
};

const MIN_COL_WIDTHS: Record<AppColKey, number> = {
  check: 40,
  stt: 44,
  fullname: 120,
  studentcode: 85,
  class: 80,
  faculty: 100,
  campaign: 120,
  standards: 120,
  submittedAt: 90,
  status: 90,
  actions: 70,
};

const COL_STORAGE_KEY = 'sv5t-application-table-colwidths-v1';

export function ApplicationListPage() {
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

  // Client-side filtering by search term (name, studentCode, administrativeClass, faculty, campaignName)
  const items = useMemo(() => {
    if (!debouncedSearch.trim()) return rawItems;
    const q = debouncedSearch.toLowerCase().trim();

    return rawItems.filter((app) => {
      let snapshot: ApplicantSnapshot = {};
      try {
        if (app.applicantSnapshotJson) snapshot = JSON.parse(app.applicantSnapshotJson);
      } catch {
        snapshot = {};
      }

      const matchName = snapshot.fullName?.toLowerCase().includes(q);
      const matchCode = snapshot.studentCode?.toLowerCase().includes(q);
      const matchClass = snapshot.administrativeClass?.toLowerCase().includes(q);
      const matchFaculty = snapshot.faculty?.toLowerCase().includes(q);
      const matchEmail = snapshot.email?.toLowerCase().includes(q);
      const matchCampaign = app.campaignName?.toLowerCase().includes(q);

      return matchName || matchCode || matchClass || matchFaculty || matchEmail || matchCampaign;
    });
  }, [rawItems, debouncedSearch]);

  // Quick stats matching 4-stat cards framework of StudentListPage
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

  // Resizable column logic
  const [colWidths, setColWidths] = useState<Record<AppColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<AppColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COL_WIDTHS;
  });
  const resizingRef = useRef<{ key: AppColKey; startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch {
      /* ignore */
    }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, key: AppColKey) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = { key, startX: e.clientX, startW: colWidths[key] };
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
    [colWidths]
  );

  const ResizeHandle = ({ colKey }: { colKey: AppColKey }) => (
    <span
      onMouseDown={(e) => onResizeStart(e, colKey)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setColWidths((prev) => ({ ...prev, [colKey]: DEFAULT_COL_WIDTHS[colKey] }));
      }}
      title="Kéo để đổi độ rộng cột (double-click để reset)"
      className="absolute top-0 right-0 h-full w-3 cursor-col-resize select-none touch-none group/resize flex items-center justify-end"
    >
      <span className="block mr-[3px] h-4 w-px bg-[#C9CDD3] transition-colors group-hover/resize:bg-[#1683ff] group-active/resize:bg-[#1683ff]" />
    </span>
  );

  const col = (_key: AppColKey, extra: string = '') => `relative px-3 ${extra}`;

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths]
  );

  // Export CSV without applicationCode, with STT, MSSV, Class, Faculty
  const handleExportCsv = () => {
    const rowsToExport = items.filter((i) =>
      selectedRowIds.size ? selectedRowIds.has(i.id) : true
    );
    if (!rowsToExport.length) {
      setBanner({ ok: false, msg: 'Không có dữ liệu để xuất.' });
      return;
    }

    const headers = [
      'STT',
      'Họ và tên',
      'MSSV',
      'Lớp',
      'Khoa/Viện',
      'Chiến dịch',
      'Tiêu chuẩn đạt',
      'Ngày nộp',
      'Trạng thái',
      'Nhận xét đánh giá',
    ];

    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const lines = [headers.join(',')].concat(
      rowsToExport.map((r, idx) => {
        let snapshot: ApplicantSnapshot = {};
        try {
          if (r.applicantSnapshotJson) snapshot = JSON.parse(r.applicantSnapshotJson);
        } catch {
          snapshot = {};
        }

        const approvedStandards = r.standards?.filter((s) => s.complete).length ?? 0;

        return [
          esc(idx + 1),
          esc(snapshot.fullName || ''),
          esc(snapshot.studentCode || ''),
          esc(snapshot.administrativeClass || ''),
          esc(snapshot.faculty || ''),
          esc(r.campaignName),
          esc(`${approvedStandards}/5`),
          esc(r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('vi-VN') : ''),
          esc('Đã nộp'),
          esc(r.reviewerGeneralNote || r.rejectionReason || ''),
        ].join(',');
      })
    );

    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh-sach-ho-so-sv5t-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setBanner({ ok: true, msg: `Đã xuất ${rowsToExport.length} hồ sơ ra tệp CSV.` });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCampaignId('');
    setPageIndex(1);
    setSearchParams({});
  };

  return (
    <div
      className="w-full max-w-[1400px] mx-auto space-y-4 pb-10 font-inter font-['Inter',_sans-serif] text-slate-800"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* Header */}
      <AdminPageHeader
        title="Quản lý hồ sơ xét duyệt"
        description="Thẩm định và theo dõi tiến độ hồ sơ sinh viên đăng ký danh hiệu SV5T."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#d7f0df] text-[#1c7a45] text-xs font-normal shadow-xs hover:bg-[#bfe6cc] hover:text-[#145c34] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer"
            >
              <Download size={13} strokeWidth={1.8} />
              <span>Xuất CSV{selectedRowIds.size > 0 ? ` (${selectedRowIds.size})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#a6cffb] text-[#244a7d] text-xs font-normal shadow-xs hover:bg-[#8fbff9] hover:text-[#1a3a65] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer"
            >
              <RefreshCw
                size={13}
                strokeWidth={1.8}
                className={isPending ? 'animate-spin' : ''}
              />
              <span>Làm mới</span>
            </button>
          </div>
        }
      />

      {/* Banner message */}
      {banner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            banner.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{banner.msg}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="p-1 hover:bg-white/60 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4 Stat Cards - Bé, đơn giản, giảm height tối đa, trực quan giống StudentListPage */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: Users,
            label: 'Tổng hồ sơ',
            value: totalCount.toLocaleString('vi-VN'),
            color: 'text-blue-600 bg-blue-50',
            onClick: () => setSelectedStatus(''),
          },
          {
            icon: Clock,
            label: 'Đã nộp',
            value: String(stats.submitted),
            color: 'text-emerald-600 bg-emerald-50',
            onClick: () => setSelectedStatus('Submitted'),
          },
          {
            icon: CheckCircle2,
            label: 'Đạt 5/5 tiêu chuẩn',
            value: String(stats.approvedAll5),
            color: 'text-violet-600 bg-violet-50',
          },
          {
            icon: BookOpen,
            label: 'Chiến dịch',
            value: String(campaigns.length),
            color: 'text-amber-600 bg-amber-50',
          },
        ].map((item) => (
          <div
            key={item.label}
            onClick={item.onClick}
            className={`bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors ${
              item.onClick ? 'cursor-pointer' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}
            >
              <item.icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-600 font-medium truncate">{item.label}</div>
              <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unified card: Filter + Table - khung chuẩn StudentListPage */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        {/* Zone 1: Filter toolbar - gọn, căn đều top/bottom giống StudentListPage */}
        <div className="px-3 sm:px-4 pt-2.5 pb-2.5 space-y-1 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="filter-no-ring flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
            {/* Search - ngắn 1 nửa, nằm bên trái */}
            <div className="relative w-full lg:w-[46%] lg:max-w-[490px] shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm theo họ tên, mã sinh viên (MSSV)..."
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

            {/* Cụm phải: 2 selects + nút reset */}
            <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2">
              <div className="flex w-full sm:w-auto gap-1.5">
                {/* Campaign Select */}
                <div className="relative w-full sm:w-[220px] shrink-0">
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
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>

                {/* Status Select */}
                <div className="relative w-full sm:w-[155px] shrink-0">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="Submitted">Đã nộp</option>
                    <option value="NeedsRevision">Yêu cầu bổ sung</option>
                    <option value="Resubmitted">Đã nộp lại</option>
                    <option value="Approved">Đã duyệt</option>
                    <option value="Rejected">Từ chối</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Reset filter button if any active filter */}
              {(debouncedSearch || selectedCampaignId || selectedStatus) && (
                <div className="w-full sm:w-auto flex items-center justify-end shrink-0">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="h-9 px-3 rounded-md border border-slate-300 hover:border-slate-400 bg-white text-[12px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                  >
                    <X size={12} />
                    <span>Đặt lại</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {(debouncedSearch || selectedCampaignId || selectedStatus) && (
            <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-[11px] font-normal text-slate-500 mr-0.5">Đang lọc:</span>

              {debouncedSearch.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-600 font-normal text-[11px]">
                  "{debouncedSearch}"
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedCampaignId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                  Chiến dịch:{' '}
                  {campaigns.find((c) => c.id === selectedCampaignId)?.name || selectedCampaignId}
                  <button
                    type="button"
                    onClick={() => setSelectedCampaignId('')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedStatus && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                  Trạng thái: {APPLICATION_STATUS_CONFIG[selectedStatus]?.label || selectedStatus}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Short divider: gradient rule separating filter / table */}
        <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
        </div>

        {/* Zone 2: Table — Excel-like header có handle kéo | rows sạch, co giãn mượt */}
        <div className="overflow-x-auto custom-scrollbar">
          <table
            className="tbl-div border-collapse text-xs table-fixed"
            style={{ width: totalTableWidth, minWidth: '100%' }}
          >
            <colgroup>
              {(Object.keys(DEFAULT_COL_WIDTHS) as AppColKey[]).map((k) => (
                <col key={k} style={{ width: colWidths[k] }} />
              ))}
            </colgroup>

            {/* Table Header: neutral gray (#ECEDEF) chuẩn StudentListPage */}
            <thead>
              <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
                {/* 1. Checkbox */}
                <th
                  className={col('check', 'py-3.5 text-center')}
                  style={{ width: colWidths.check }}
                >
                  <input
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                    aria-label="Chọn tất cả"
                  />
                  <ResizeHandle colKey="check" />
                </th>

                {/* 2. STT */}
                <th
                  className={col(
                    'stt',
                    'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black'
                  )}
                  style={{ width: colWidths.stt }}
                >
                  <span className="block truncate">STT</span>
                  <ResizeHandle colKey="stt" />
                </th>

                {/* 3. Họ tên (bỏ icon hình) */}
                <th
                  className={col(
                    'fullname',
                    'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden'
                  )}
                  style={{ width: colWidths.fullname }}
                >
                  <span className="block truncate">Họ tên</span>
                  <ResizeHandle colKey="fullname" />
                </th>

                {/* 4. MSSV - cột mới tách ra */}
                <th
                  className={col(
                    'studentcode',
                    'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden'
                  )}
                  style={{ width: colWidths.studentcode }}
                >
                  <span className="block truncate">MSSV</span>
                  <ResizeHandle colKey="studentcode" />
                </th>

                {/* 5. Lớp - cột mới tách ra */}
                <th
                  className={col(
                    'class',
                    'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden'
                  )}
                  style={{ width: colWidths.class }}
                >
                  <span className="block truncate">Lớp</span>
                  <ResizeHandle colKey="class" />
                </th>

                {/* 6. Khoa - cột mới tách ra */}
                <th
                  className={col(
                    'faculty',
                    'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden'
                  )}
                  style={{ width: colWidths.faculty }}
                >
                  <span className="block truncate">Khoa</span>
                  <ResizeHandle colKey="faculty" />
                </th>

                {/* 7. Chiến dịch */}
                <th
                  className={col(
                    'campaign',
                    'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden'
                  )}
                  style={{ width: colWidths.campaign }}
                >
                  <span className="block truncate">Chiến dịch</span>
                  <ResizeHandle colKey="campaign" />
                </th>

                {/* 8. Tiêu chuẩn */}
                <th
                  className={col(
                    'standards',
                    'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden'
                  )}
                  style={{ width: colWidths.standards }}
                >
                  <span className="block truncate">Tiêu chuẩn</span>
                  <ResizeHandle colKey="standards" />
                </th>

                {/* 9. Ngày nộp */}
                <th
                  className={col(
                    'submittedAt',
                    'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden'
                  )}
                  style={{ width: colWidths.submittedAt }}
                >
                  <span className="block truncate">Ngày nộp</span>
                  <ResizeHandle colKey="submittedAt" />
                </th>

                {/* 10. Trạng thái */}
                <th
                  className={col(
                    'status',
                    'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden'
                  )}
                  style={{ width: colWidths.status }}
                >
                  <span className="block truncate">Trạng thái</span>
                  <ResizeHandle colKey="status" />
                </th>

                {/* 11. Thao tác */}
                <th
                  className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden"
                  style={{ width: colWidths.actions }}
                >
                  <span className="block truncate">Thao tác</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100/80 [&>tr:nth-child(even)]:bg-slate-50/50">
              {/* Loading State */}
              {isPending && (
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-2.5 text-center">
                        <div className="w-3.5 h-3.5 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="w-3.5 h-3 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-4 bg-slate-200 rounded w-24" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-5 bg-slate-200 rounded-full w-16 mx-auto" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="h-6 bg-slate-200 rounded w-12 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* Error State */}
              {!isPending && isError && (
                <tr>
                  <td colSpan={11} className="py-10 text-center">
                    <div className="space-y-2">
                      <AlertCircle size={24} className="text-rose-500 mx-auto" />
                      <div className="text-sm font-medium text-slate-700">Không thể tải dữ liệu</div>
                      <p className="text-xs text-slate-400 max-w-md mx-auto break-words">
                        {sanitizeApiError(error)}
                      </p>
                      <button
                        type="button"
                        onClick={() => void refetch()}
                        className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs"
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty State */}
              {!isPending && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <div className="space-y-2">
                      <FileText size={32} className="mx-auto text-slate-300" />
                      <div className="text-sm font-medium text-slate-600">
                        Chưa có hồ sơ đăng ký phù hợp
                      </div>
                      <p className="text-xs text-slate-400">
                        {debouncedSearch || selectedCampaignId || selectedStatus
                          ? 'Thử thay đổi từ khóa hoặc điều chỉnh tiêu chí bộ lọc.'
                          : 'Hiện chưa có hồ sơ nào được gửi nộp cho chiến dịch.'}
                      </p>
                      {(debouncedSearch || selectedCampaignId || selectedStatus) && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!isPending &&
                !isError &&
                items.map((app, idx) => {
                  let snapshot: ApplicantSnapshot = {};
                  try {
                    if (app.applicantSnapshotJson) snapshot = JSON.parse(app.applicantSnapshotJson);
                  } catch {
                    snapshot = {};
                  }

                  const isSelected = selectedRowIds.has(app.id);
                  const standards = app.standards ?? [];
                  const completedCount = standards.filter((s) => s.complete).length;

                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6] cursor-pointer ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="px-3 py-2.5 text-center align-middle overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).tagName !== 'INPUT') {
                            toggleSelectRow(app.id);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(app.id)}
                          className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                          aria-label={`Chọn hồ sơ ${snapshot.fullName || app.id}`}
                        />
                      </td>

                      {/* STT */}
                      <td className="px-2 py-3 text-center align-middle text-slate-500 text-[11px] overflow-hidden whitespace-nowrap">
                        {(effectivePageIndex - 1) * effectivePageSize + idx + 1}
                      </td>

                      {/* Họ tên: bỏ icon hình trước tên sinh viên */}
                      <td className="px-3 py-2.5 text-left align-middle overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedAppId(app.id)}
                          className="cursor-pointer group/link block text-left max-w-full"
                          title={snapshot.fullName || '—'}
                        >
                          <div className="text-[13px] text-slate-800 truncate text-left font-medium hover:text-[#0866db] transition-colors">
                            {snapshot.fullName || '—'}
                          </div>
                        </button>
                      </td>

                      {/* MSSV: cột mới tách ra */}
                      <td className="px-3 py-2.5 text-left align-middle text-slate-800 whitespace-nowrap overflow-hidden">
                        <span className="block truncate font-mono text-[12px]">
                          {snapshot.studentCode || '—'}
                        </span>
                      </td>

                      {/* Lớp: cột mới tách ra */}
                      <td className="px-3 py-2.5 text-left align-middle text-slate-600 whitespace-nowrap overflow-hidden">
                        <span className="block truncate text-[12px]">
                          {snapshot.administrativeClass || '—'}
                        </span>
                      </td>

                      {/* Khoa: cột mới tách ra */}
                      <td className="px-3 py-2.5 text-left align-middle text-slate-600 overflow-hidden">
                        <div className="truncate text-[12px]" title={snapshot.faculty || ''}>
                          {snapshot.faculty || '—'}
                        </div>
                      </td>

                      {/* Chiến dịch */}
                      <td className="px-3 py-2.5 text-left align-middle text-slate-700 overflow-hidden">
                        <div
                          className="truncate text-[12px] font-normal"
                          title={app.campaignName || ''}
                        >
                          {app.campaignName || '—'}
                        </div>
                      </td>

                      {/* 5 Tiêu chuẩn */}
                      <td className="px-3 py-2.5 text-left align-middle overflow-hidden whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            {(['Ethics', 'Study', 'Fitness', 'Volunteer', 'Integration'] as const).map(
                              (groupKey) => {
                                const std = standards.find((s) => s.groupCode === groupKey);
                                const isComplete = std?.complete ?? false;
                                const conf = GROUP_ICONS[groupKey];
                                const Icon = conf.icon;

                                return (
                                  <div
                                    key={groupKey}
                                    title={`${conf.label}: ${
                                      std ? `${std.approvedCount}/${std.requiredCount} đã duyệt` : 'Chưa có'
                                    }`}
                                    className={`w-5 h-5 rounded flex items-center justify-center transition-transform hover:scale-110 ${
                                      isComplete
                                        ? 'bg-emerald-100 text-emerald-700 font-bold'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    <Icon size={11} />
                                  </div>
                                );
                              }
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            ({completedCount}/5)
                          </span>
                        </div>
                      </td>

                      {/* Ngày nộp */}
                      <td className="px-3 py-2.5 text-center align-middle text-slate-600 whitespace-nowrap overflow-hidden">
                        <span className="block truncate text-[12px]">
                          {fmtDate(app.submittedAt)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-3 py-2.5 text-center align-middle overflow-hidden whitespace-nowrap">
                        <div className="inline-flex justify-center max-w-full overflow-hidden whitespace-nowrap">
                          {(() => {
                            const badge = APPLICATION_STATUS_CONFIG[app.status] || APPLICATION_STATUS_CONFIG.Submitted;
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{badge.label}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Thao tác: chữ thẩm định thay bằng chữ xem */}
                      <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                        <div className="inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppId(app.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#e8f3ff] text-[#0866db] hover:bg-[#1683ff] hover:text-white border border-[#dceafd] hover:border-[#1683ff] text-[12px] font-medium transition-all cursor-pointer shadow-2xs"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye size={13} />
                            <span>Xem</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - chuẩn StudentListPage */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500">
          <span className="font-normal">
            Tổng số: <span className="font-semibold text-slate-700">{totalCount}</span>
          </span>

          <div className="flex-1" />

          <label className="inline-flex items-center gap-1.5 font-normal">
            Số dòng/trang
            <span className="relative inline-flex items-center">
              <select
                value={String(pageSize)}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="appearance-none h-7 pl-2.5 pr-7 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-600 cursor-pointer hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </span>
          </label>

          <span className="font-medium text-slate-600 tabular-nums whitespace-nowrap">
            {rangeFrom} - {rangeTo}
          </span>

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

      {/* Detail & Evaluation Modal */}
      <ApplicationDetailModal
        isOpen={Boolean(selectedAppId)}
        applicationId={selectedAppId}
        onClose={() => {
          setSelectedAppId(null);
          if (searchParams.has('id')) {
            const next = new URLSearchParams(searchParams);
            next.delete('id');
            setSearchParams(next);
          }
        }}
        onSuccessDecision={() => {
          void refetch();
          setBanner({ ok: true, msg: 'Đã cập nhật kết quả xét duyệt hồ sơ thành công!' });
        }}
      />
    </div>
  );
}
