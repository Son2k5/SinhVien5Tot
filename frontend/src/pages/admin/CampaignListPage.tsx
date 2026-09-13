import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AwardLevel,
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
  CampaignStatus,
  CAMPAIGN_STATUS_LABELS,
  type CampaignFilterParams,
  type CampaignResponse,
  type CreateCampaignRequest,
  type UpdateCampaignRequest,
} from '../../types/admin/campaign';
import {
  useCampaignMutations,
  useCampaignsPaged,
} from '../../hooks/admin/useCampaigns';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { CampaignFormModal } from '../../components/admin/CampaignFormModal';
import { CampaignStatusModal } from '../../components/admin/CampaignStatusModal';
import { sanitizeApiError } from '../../services/apiErrorSanitizer';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

const formatDate = (isoString?: string) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

const STATUS_CONFIG: Record<CampaignStatus, { bg: string; text: string; border: string; dot: string }> = {
  [CampaignStatus.Draft]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  [CampaignStatus.Open]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  [CampaignStatus.Closed]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  [CampaignStatus.Reviewing]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  [CampaignStatus.Published]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
  },
  [CampaignStatus.Archived]: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

// ── Resizable columns (Excel-like): lưu width từng cột, kéo ở mép phải header ──
type CampaignColKey =
  | 'check'
  | 'stt'
  | 'name'
  | 'schoolYear'
  | 'level'
  | 'awardType'
  | 'standardSet'
  | 'regCloseAt'
  | 'reviewDeadline'
  | 'status'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<CampaignColKey, number> = {
  check: 44,
  stt: 52,
  name: 240,
  schoolYear: 110,
  level: 110,
  awardType: 110,
  standardSet: 150,
  regCloseAt: 120,
  reviewDeadline: 120,
  status: 140,
  actions: 124,
};

const MIN_COL_WIDTHS: Record<CampaignColKey, number> = {
  check: 40,
  stt: 44,
  name: 140,
  schoolYear: 80,
  level: 85,
  awardType: 85,
  standardSet: 100,
  regCloseAt: 95,
  reviewDeadline: 95,
  status: 110,
  actions: 110,
};

const COL_STORAGE_KEY = 'sv5t-campaign-table-colwidths-v1';

export function CampaignListPage() {
  const navigate = useNavigate();

  // Filters state
  const [level, setLevel] = useState<AwardLevel | ''>('');
  const [status, setStatus] = useState<CampaignStatus | ''>('');
  const [schoolYear, setSchoolYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Checkbox selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Column resizing state
  const [colWidths, setColWidths] = useState<Record<CampaignColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<CampaignColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch { /* ignore */ }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ key: CampaignColKey; startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch { /* ignore */ }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, key: CampaignColKey) => {
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
    [colWidths],
  );

  // Tay kéo ở mép phải mỗi <th> — vạch | ngắn 16px nằm giữa header có khoảng trống top/bottom, chỉ có ở header không có ở row
  const ResizeHandle = ({ colKey }: { colKey: CampaignColKey }) => (
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

  const col = (_key: CampaignColKey, extra: string = '') =>
    `relative px-3 ${extra}`;

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths],
  );

  const queryParams: CampaignFilterParams = useMemo(
    () => ({
      level: level !== '' ? level : undefined,
      status: status !== '' ? status : undefined,
      schoolYear: schoolYear.trim() ? schoolYear.trim() : undefined,
      pageIndex,
      pageSize,
    }),
    [level, status, schoolYear, pageIndex, pageSize],
  );

  const { data, isPending, isError, refetch } = useCampaignsPaged(queryParams);
  const {
    createCampaign,
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
    batchDeleteCampaigns,
  } = useCampaignMutations();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignResponse | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusCampaign, setStatusCampaign] = useState<CampaignResponse | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<CampaignResponse | null>(null);

  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (level !== '') count++;
    if (status !== '') count++;
    if (schoolYear.trim()) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [level, status, schoolYear, searchQuery]);

  const handleResetFilters = () => {
    setLevel('');
    setStatus('');
    setSchoolYear('');
    setSearchQuery('');
    setPageIndex(1);
    setSelected(new Set());
  };

  // Client-side search filtering on page results
  const items = useMemo(() => {
    const list = data?.items ?? [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.schoolYear.toLowerCase().includes(q) ||
        (c.standardSetName && c.standardSetName.toLowerCase().includes(q)),
    );
  }, [data?.items, searchQuery]);

  const total = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const effectivePageSize = data?.pageSize ?? pageSize;
  const effectivePageIndex = data?.pageIndex ?? pageIndex;
  const rangeFrom = total === 0 ? 0 : (effectivePageIndex - 1) * effectivePageSize + 1;
  const rangeTo = Math.min(effectivePageIndex * effectivePageSize, total);
  const canPrev = effectivePageIndex <= 1;
  const canNext = totalPages <= 1 ? false : effectivePageIndex >= totalPages;

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setPageIndex(1);
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const allChecked = items.length > 0 && items.every((i) => selected.has(i.id));
  const isIndeterminate = items.length > 0 && items.some((i) => selected.has(i.id)) && !allChecked;

  const toggleAll = (on: boolean) => {
    setSelected(on ? new Set(items.map((i) => i.id)) : new Set());
  };

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (campaign: CampaignResponse) => {
    setEditingCampaign(campaign);
    setIsFormModalOpen(true);
  };

  const handleOpenStatus = (campaign: CampaignResponse) => {
    setStatusCampaign(campaign);
    setIsStatusModalOpen(true);
  };

  const handleOpenDelete = (campaign: CampaignResponse) => {
    setDeletingCampaign(campaign);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (
    formData: CreateCampaignRequest | UpdateCampaignRequest,
  ) => {
    if (editingCampaign) {
      await updateCampaign.mutateAsync({
        id: editingCampaign.id,
        data: formData as UpdateCampaignRequest,
      });
    } else {
      await createCampaign.mutateAsync(formData as CreateCampaignRequest);
    }
  };

  const handleStatusSave = async (newStatus: CampaignStatus) => {
    if (!statusCampaign) return;
    await updateCampaignStatus.mutateAsync({
      id: statusCampaign.id,
      request: { status: newStatus },
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCampaign) return;
    try {
      await deleteCampaign.mutateAsync(deletingCampaign.id);
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(deletingCampaign.id);
        return n;
      });
      setBanner({ ok: true, msg: `Đã xóa chiến dịch "${deletingCampaign.name}".` });
    } catch (e) {
      setBanner({ ok: false, msg: sanitizeApiError(e) });
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingCampaign(null);
    }
  };

  const handleBatchDeleteConfirm = async () => {
    if (selected.size === 0) return;
    try {
      const ids = Array.from(selected);
      const res = await batchDeleteCampaigns.mutateAsync(ids);
      setSelected(new Set());
      setIsBatchDeleteModalOpen(false);
      setBanner({ ok: true, msg: `Đã xóa thành công ${res.deletedCount} chiến dịch.` });
    } catch (e) {
      setBanner({ ok: false, msg: sanitizeApiError(e) });
      setIsBatchDeleteModalOpen(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-10">
      {/* Page Header */}
      <AdminPageHeader
        title="Chiến dịch SV5T"
        description="Quản lý thời hạn, bộ tiêu chuẩn và tiến độ các đợt xét duyệt Sinh viên 5 tốt."
        breadcrumbs={[{ label: 'Chiến dịch' }]}
        actions={
          <>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-normal shadow-xs hover:bg-rose-600 hover:text-white hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <Trash2 size={13} strokeWidth={1.8} />
                <span>Xóa đã chọn ({selected.size})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#d7f0df] text-[#1c7a45] text-xs font-normal shadow-xs hover:bg-[#bfe6cc] hover:text-[#145c34] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer"
            >
              <RefreshCw size={13} strokeWidth={1.8} className={isPending ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-[#1683ff] text-white text-xs font-medium shadow-xs hover:bg-[#0866db] hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus size={14} strokeWidth={2} />
              <span>Tạo chiến dịch</span>
            </button>
          </>
        }
      />

      {/* Banner */}
      {banner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            banner.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
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

      {/* Unified card: Filter + Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        {/* Zone 1: Filter toolbar - gọn, căn đều top/bottom */}
        <div className="px-3 sm:px-4 pt-2.5 pb-2.5 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="filter-no-ring flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
            {/* Search - ngan 1 nua, nam ben trai */}
            <div className="relative w-full lg:w-[46%] lg:max-w-[490px] shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên chiến dịch, năm học..."
                  aria-label="Tìm theo tên chiến dịch, năm học"
                  className="w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-8 pr-8 py-0 text-[12px] leading-9 font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none transition-colors shadow-2xs"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Cum phai: selects + nam hoc + nut reset */}
            <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2">
              <div className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto gap-1.5">
                {/* Level select */}
                <div className="relative w-full sm:w-[145px] shrink-0">
                  <select
                    value={level}
                    onChange={(e) => {
                      setLevel(e.target.value ? (e.target.value as AwardLevel) : '');
                      setPageIndex(1);
                    }}
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="">Tất cả cấp xét</option>
                    <option value={AwardLevel.School}>Cấp Trường</option>
                    <option value={AwardLevel.City}>Cấp Thành phố</option>
                    <option value={AwardLevel.Central}>Cấp Trung ương</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Status select */}
                <div className="relative w-full sm:w-[155px] shrink-0">
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value ? (e.target.value as CampaignStatus) : '');
                      setPageIndex(1);
                    }}
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value={CampaignStatus.Draft}>Bản nháp</option>
                    <option value={CampaignStatus.Open}>Đang mở đăng ký</option>
                    <option value={CampaignStatus.Closed}>Đã đóng đăng ký</option>
                    <option value={CampaignStatus.Reviewing}>Đang xét duyệt</option>
                    <option value={CampaignStatus.Published}>Đã công bố</option>
                    <option value={CampaignStatus.Archived}>Đã lưu trữ</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* School Year input */}
                <div className="relative w-full sm:w-[145px] shrink-0">
                  <input
                    type="text"
                    value={schoolYear}
                    onChange={(e) => {
                      setSchoolYear(e.target.value);
                      setPageIndex(1);
                    }}
                    placeholder="Năm học (VD: 25-26)"
                    className="w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none transition-colors shadow-2xs"
                  />
                  {schoolYear && (
                    <button
                      type="button"
                      onClick={() => {
                        setSchoolYear('');
                        setPageIndex(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                      title="Xóa năm học"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Reset Filters button if any filter active */}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="h-9 px-2.5 text-[12px] font-normal text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="Xóa toàn bộ bộ lọc"
                  >
                    <RotateCcw size={11} />
                    <span>Xóa lọc ({activeFilterCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Short divider separating filter / table */}
        <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
        </div>

        {/* Zone 2: Table - y hệt StudentListPage có kéo thả width, căn 1 dòng, vạch | ở header */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="tbl-div border-collapse text-xs table-fixed" style={{ width: totalTableWidth, minWidth: '100%' }}>
            <colgroup>
              {(Object.keys(DEFAULT_COL_WIDTHS) as CampaignColKey[]).map((k) => (
                <col key={k} style={{ width: colWidths[k] }} />
              ))}
            </colgroup>

            {/* Table Header: neutral gray (#ECEDEF) - căn thẳng 1 dòng, có vạch | kéo thả */}
            <thead>
              <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
                {/* 1. Checkbox */}
                <th className={col('check', 'py-3.5 text-center')} style={{ width: colWidths.check }}>
                  <input
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                    aria-label="Chọn tất cả"
                  />
                  <ResizeHandle colKey="check" />
                </th>

                {/* 2. STT */}
                <th className={col('stt', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.stt }}>
                  <span className="block truncate">STT</span>
                  <ResizeHandle colKey="stt" />
                </th>

                {/* 3. Chiến dịch */}
                <th className={col('name', 'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.name }}>
                  <span className="block truncate">Chiến dịch</span>
                  <ResizeHandle colKey="name" />
                </th>

                {/* 4. Niên khóa */}
                <th className={col('schoolYear', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.schoolYear }}>
                  <span className="block truncate">Niên khóa</span>
                  <ResizeHandle colKey="schoolYear" />
                </th>

                {/* 5. Cấp xét */}
                <th className={col('level', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.level }}>
                  <span className="block truncate">Cấp xét</span>
                  <ResizeHandle colKey="level" />
                </th>

                {/* 6. Đối tượng */}
                <th className={col('awardType', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.awardType }}>
                  <span className="block truncate">Đối tượng</span>
                  <ResizeHandle colKey="awardType" />
                </th>

                {/* 7. Bộ tiêu chuẩn */}
                <th className={col('standardSet', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.standardSet }}>
                  <span className="block truncate">Bộ tiêu chuẩn</span>
                  <ResizeHandle colKey="standardSet" />
                </th>

                {/* 8. Hạn đăng ký */}
                <th className={col('regCloseAt', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.regCloseAt }}>
                  <span className="block truncate">Hạn đăng ký</span>
                  <ResizeHandle colKey="regCloseAt" />
                </th>

                {/* 9. Hạn xét duyệt */}
                <th className={col('reviewDeadline', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.reviewDeadline }}>
                  <span className="block truncate">Hạn xét duyệt</span>
                  <ResizeHandle colKey="reviewDeadline" />
                </th>

                {/* 10. Trạng thái */}
                <th className={col('status', 'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden')} style={{ width: colWidths.status }}>
                  <span className="block truncate">Trạng thái</span>
                  <ResizeHandle colKey="status" />
                </th>

                {/* 11. Thao tác */}
                <th className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden" style={{ width: colWidths.actions }}>
                  <span className="block truncate">Thao tác</span>
                </th>
              </tr>
            </thead>

            {/* Table Body - không có vạch dọc, chữ dài hiện ... */}
            <tbody className="divide-y divide-slate-100/80 [&>tr:nth-child(even)]:bg-slate-50/50">
              {/* Loading Skeleton */}
              {isPending && (
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-2.5 text-center"><div className="w-3.5 h-3.5 bg-slate-200 rounded mx-auto" /></td>
                      <td className="px-2 py-2 text-center"><div className="w-3.5 h-3 bg-slate-200 rounded mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-3/4" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-28 mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" /></td>
                      <td className="px-3 py-2"><div className="h-5 bg-slate-200 rounded-full w-24 mx-auto" /></td>
                      <td className="px-3 py-2.5 text-center"><div className="h-7 bg-slate-200 rounded w-20 mx-auto" /></td>
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
                      <div className="text-sm font-medium text-slate-700">Không thể tải dữ liệu chiến dịch</div>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Đã có lỗi xảy ra trong quá trình kết nối đến máy chủ.
                      </p>
                      <button
                        type="button"
                        onClick={() => void refetch()}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs"
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
                      <div className="text-sm font-medium text-slate-600">Không tìm thấy đợt xét nào phù hợp</div>
                      <p className="text-xs text-slate-400">
                        {activeFilterCount > 0
                          ? 'Thử thay đổi từ khóa hoặc điều chỉnh tiêu chí bộ lọc.'
                          : 'Hiện chưa có chiến dịch SV5T nào trong hệ thống.'}
                      </p>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!isPending && !isError && items.map((campaign, idx) => {
                const isClosedOrArchived =
                  campaign.status === CampaignStatus.Closed ||
                  campaign.status === CampaignStatus.Archived;
                const statusCfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG[CampaignStatus.Draft];

                return (
                  <tr
                    key={campaign.id}
                    className="hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6]"
                  >
                    {/* 1. Checkbox */}
                    <td
                      className="px-3 py-2.5 text-center align-middle overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                          toggleOne(campaign.id);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(campaign.id)}
                        onChange={() => toggleOne(campaign.id)}
                        className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                        title={`Chọn ${campaign.name}`}
                        aria-label={`Chọn ${campaign.name}`}
                      />
                    </td>

                    {/* 2. STT */}
                    <td className="px-2 py-3 text-center align-middle text-slate-500 text-[11px] overflow-hidden whitespace-nowrap">
                      {(effectivePageIndex - 1) * effectivePageSize + idx + 1}
                    </td>

                    {/* 3. Tên chiến dịch - chữ dài hiện ... */}
                    <td className="px-3 py-2.5 text-left align-middle overflow-hidden whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                        className="cursor-pointer block text-left max-w-full truncate"
                        title={campaign.name}
                      >
                        <span className="text-[13px] font-normal text-slate-800 hover:text-[#1683ff] transition-colors truncate block">
                          {campaign.name}
                        </span>
                      </button>
                      {campaign.prerequisiteCampaignName && (
                        <div
                          className="text-[11px] text-slate-400 mt-0.5 truncate max-w-full"
                          title={`Tiên quyết: ${campaign.prerequisiteCampaignName}`}
                        >
                          Tiên quyết: <span className="text-slate-600 font-normal">{campaign.prerequisiteCampaignName}</span>
                        </div>
                      )}
                    </td>

                    {/* 4. Niên khóa - chữ dài hiện ... */}
                    <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                      <span className="block truncate text-xs font-normal" title={campaign.schoolYear || '—'}>
                        {campaign.schoolYear || '—'}
                      </span>
                    </td>

                    {/* 5. Cấp xét - chữ thường, không background, dài hiện ... */}
                    <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                      <span className="block truncate text-xs font-normal" title={AWARD_LEVEL_LABELS[campaign.level] ?? campaign.level}>
                        {AWARD_LEVEL_LABELS[campaign.level] ?? campaign.level}
                      </span>
                    </td>

                    {/* 6. Đối tượng - chữ thường, không background, dài hiện ... */}
                    <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                      <span className="block truncate text-xs font-normal" title={AWARD_TYPE_LABELS[campaign.awardType] ?? campaign.awardType}>
                        {AWARD_TYPE_LABELS[campaign.awardType] ?? campaign.awardType}
                      </span>
                    </td>

                    {/* 7. Bộ tiêu chuẩn - chữ dài hiện ... */}
                    <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                      <span
                        className="block truncate text-xs font-normal"
                        title={campaign.standardSetName || campaign.standardSetId}
                      >
                        {campaign.standardSetName || (
                          <span className="font-mono text-slate-400 text-[11px]">
                            ID: {campaign.standardSetId.slice(0, 8)}...
                          </span>
                        )}
                      </span>
                    </td>

                    {/* 8. Hạn đăng ký - chữ dài hiện ... */}
                    <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                      <span className="block truncate text-xs font-normal" title={formatDate(campaign.regCloseAt)}>
                        {formatDate(campaign.regCloseAt)}
                      </span>
                    </td>

                    {/* 9. Hạn xét duyệt - chữ dài hiện ... */}
                    <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                      <span className="block truncate text-xs font-normal" title={formatDate(campaign.reviewDeadline)}>
                        {formatDate(campaign.reviewDeadline)}
                      </span>
                    </td>

                    {/* 10. Trạng thái - Bỏ icon dùng dấu chấm, đặt sau hạn xét duyệt và trước thao tác */}
                    <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap overflow-hidden">
                      <div className="inline-flex justify-center max-w-full overflow-hidden whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenStatus(campaign)}
                          className={`inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-full border text-[11px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity max-w-full overflow-hidden ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          title="Bấm để cập nhật trạng thái"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} shrink-0`} />
                          <span className="truncate">{CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}</span>
                        </button>
                      </div>
                    </td>

                    {/* 11. Thao tác */}
                    <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap overflow-hidden">
                      <div className="inline-flex items-center gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                          className="h-7 w-7 rounded-full bg-[#e8f3ff] text-[#0866db] hover:bg-[#1683ff] hover:text-white border border-[#dceafd] hover:border-[#1683ff] flex items-center justify-center transition-all cursor-pointer"
                          title="Xem chi tiết chiến dịch"
                          aria-label={`Xem chi tiết ${campaign.name}`}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(campaign)}
                          disabled={isClosedOrArchived}
                          className="h-7 w-7 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border border-amber-200 hover:border-amber-600 flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          title={
                            isClosedOrArchived
                              ? 'Không thể sửa chiến dịch đã đóng hoặc lưu trữ'
                              : 'Chỉnh sửa đợt xét'
                          }
                          aria-label={`Chỉnh sửa ${campaign.name}`}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(campaign)}
                          className="h-7 w-7 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                          title="Xoá chiến dịch"
                          aria-label={`Xoá ${campaign.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - gọn hiện đại y hệt StudentListPage */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500">
          <span className="font-normal">
            Tổng số: <span className="font-semibold text-slate-700">{total}</span>
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
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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

      {/* Create / Edit Modal */}
      <CampaignFormModal
        isOpen={isFormModalOpen}
        campaign={editingCampaign}
        isLoading={createCampaign.isPending || updateCampaign.isPending}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Change Status Modal */}
      <CampaignStatusModal
        isOpen={isStatusModalOpen}
        campaign={statusCampaign}
        isLoading={updateCampaignStatus.isPending}
        onClose={() => setIsStatusModalOpen(false)}
        onSave={handleStatusSave}
      />

      {/* Delete Confirm Modal */}
      <AdminConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Xác nhận xoá chiến dịch"
        description={`Bạn có chắc chắn muốn xoá chiến dịch "${deletingCampaign?.name}"?\n\nLưu ý: Chỉ có thể xoá chiến dịch chưa phát sinh hồ sơ đăng ký. Thao tác này không thể hoàn tác.`}
        confirmText="Xác nhận xoá"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteCampaign.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* Batch Delete Confirm Modal */}
      <AdminConfirmDialog
        isOpen={isBatchDeleteModalOpen}
        title={`Xác nhận xoá ${selected.size} chiến dịch`}
        description={`Bạn có chắc chắn muốn xoá ${selected.size} chiến dịch đã chọn?\n\nLưu ý: Thao tác này sẽ xoá hoàn toàn các chiến dịch đã chọn khỏi hệ thống (chỉ có thể xoá các chiến dịch chưa phát sinh hồ sơ đăng ký) và không thể khôi phục.`}
        confirmText={`Xoá ${selected.size} chiến dịch`}
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={batchDeleteCampaigns.isPending}
        onConfirm={handleBatchDeleteConfirm}
        onClose={() => setIsBatchDeleteModalOpen(false)}
      />
    </div>
  );
}
