import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AwardLevel,
  AwardType,
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
} from '../../types/admin/campaign';
import {
  StandardSetStatus,
  type CreateStandardSetRequest,
  type StandardSetResponse,
  type UpdateStandardSetRequest,
} from '../../types/admin/standard';
import {
  useStandardSetMutations,
  useStandardSets,
} from '../../hooks/admin/useStandards';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { StandardSetFormModal } from '../../components/admin/StandardSetFormModal';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit2,
  Eye,
  FolderTree,
  MoreVertical,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

const formatDate = (isoString?: string | null) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

type StandardSetColKey =
  | 'check'
  | 'stt'
  | 'name'
  | 'academicYear'
  | 'level'
  | 'awardType'
  | 'publishedAt'
  | 'status'
  | 'actions';

const DEFAULT_COL_WIDTHS: Record<StandardSetColKey, number> = {
  check: 44,
  stt: 52,
  name: 300,
  academicYear: 120,
  level: 130,
  awardType: 120,
  publishedAt: 130,
  status: 140,
  actions: 80,
};

const MIN_COL_WIDTHS: Record<StandardSetColKey, number> = {
  check: 40,
  stt: 44,
  name: 180,
  academicYear: 90,
  level: 95,
  awardType: 90,
  publishedAt: 100,
  status: 115,
  actions: 65,
};

const COL_STORAGE_KEY = 'sv5t-standardset-table-colwidths-v3';

const STATUS_CONFIG: Record<
  StandardSetStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  [StandardSetStatus.Draft]: {
    label: 'Bản nháp',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  [StandardSetStatus.Published]: {
    label: 'Đã công bố',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  [StandardSetStatus.Archived]: {
    label: 'Đã lưu trữ',
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
};

export function StandardSetListPage() {
  const navigate = useNavigate();

  const { data: standardSets = [], isPending, isError, error, refetch } = useStandardSets();
  const {
    createStandardSet,
    updateStandardSet,
    deleteStandardSet,
    publishStandardSet,
    unpublishStandardSet,
  } = useStandardSetMutations();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<AwardLevel | ''>('');
  const [typeFilter, setTypeFilter] = useState<AwardType | ''>('');
  const [statusFilter, setStatusFilter] = useState<StandardSetStatus | ''>('');

  // Sorting
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Checkbox selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Banner notification
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<StandardSetResponse | null>(null);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishingSet, setPublishingSet] = useState<StandardSetResponse | null>(null);

  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [unpublishingSet, setUnpublishingSet] = useState<StandardSetResponse | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSet, setDeletingSet] = useState<StandardSetResponse | null>(null);

  // Action dropdown menu (kebab / 3-dots / hamburger)
  const [menuOpenFor, setMenuOpenFor] = useState<{
    item: StandardSetResponse;
    top: number;
    left: number;
  } | null>(null);

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: StandardSetResponse,
  ) => {
    e.stopPropagation();
    if (menuOpenFor?.item.id === item.id) {
      setMenuOpenFor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 195;
    const menuHeight = item.status === StandardSetStatus.Draft ? 165 : 100;

    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight && rect.top - menuHeight > 0) {
      top = rect.top - menuHeight - 4;
    }

    let left = rect.right - menuWidth;
    if (left < 10) left = 10;

    setMenuOpenFor({ item, top, left });
  };

  const closeMenu = useCallback(() => {
    setMenuOpenFor(null);
  }, []);

  useEffect(() => {
    if (!menuOpenFor) return;

    const handleClose = () => setMenuOpenFor(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpenFor(null);
    };

    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpenFor]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Filtered & sorted standard sets
  const filteredSets = useMemo(() => {
    const list = standardSets.filter((s) => {
      if (levelFilter !== '' && s.level !== levelFilter) return false;
      if (typeFilter !== '' && s.awardType !== typeFilter) return false;
      if (statusFilter !== '' && s.status !== statusFilter) return false;
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matches =
          (s.name && s.name.toLowerCase().includes(q)) ||
          s.academicYear.toLowerCase().includes(q) ||
          (AWARD_LEVEL_LABELS[s.level] && AWARD_LEVEL_LABELS[s.level].toLowerCase().includes(q)) ||
          (AWARD_TYPE_LABELS[s.awardType] && AWARD_TYPE_LABELS[s.awardType].toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortBy) {
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
        case 'academicYear':
          valA = a.academicYear;
          valB = b.academicYear;
          break;
        case 'level':
          valA = a.level;
          valB = b.level;
          break;
        case 'awardType':
          valA = a.awardType;
          valB = b.awardType;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'publishedAt':
          valA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          valB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          break;
        case 'createdAt':
        default:
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [standardSets, levelFilter, typeFilter, statusFilter, debouncedSearch, sortBy, sortDir]);

  // Stats calculation
  const totalCount = standardSets.length;
  const publishedCount = standardSets.filter((s) => s.status === StandardSetStatus.Published).length;
  const draftCount = standardSets.filter((s) => s.status === StandardSetStatus.Draft).length;
  const individualCount = standardSets.filter((s) => s.awardType === AwardType.Individual).length;

  // Active filters count
  const filterCount =
    (levelFilter !== '' ? 1 : 0) +
    (typeFilter !== '' ? 1 : 0) +
    (statusFilter !== '' ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setLevelFilter('');
    setTypeFilter('');
    setStatusFilter('');
  };

  const toggleSort = (colKey: string) => {
    if (sortBy === colKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(colKey);
      setSortDir(colKey === 'name' || colKey === 'academicYear' ? 'asc' : 'desc');
    }
  };

  // Pagination (như trang StudentListPage)
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Reset về trang 1 khi đổi bộ lọc hoặc từ khóa tìm kiếm
  useEffect(() => {
    setPageIndex(1);
  }, [debouncedSearch, levelFilter, typeFilter, statusFilter, sortBy, sortDir]);

  const total = filteredSets.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const effectivePageIndex = Math.min(pageIndex, totalPages);
  const effectivePageSize = pageSize;
  const rangeFrom = total === 0 ? 0 : (effectivePageIndex - 1) * effectivePageSize + 1;
  const rangeTo = Math.min(effectivePageIndex * effectivePageSize, total);

  const canPrev = effectivePageIndex <= 1;
  const canNext = totalPages <= 1 ? false : effectivePageIndex >= totalPages;

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setPageIndex(1);
  };

  const pagedSets = useMemo(() => {
    const start = (effectivePageIndex - 1) * effectivePageSize;
    return filteredSets.slice(start, start + effectivePageSize);
  }, [filteredSets, effectivePageIndex, effectivePageSize]);

  // Checkbox handlers (trên các dòng trang hiện tại)
  const allChecked = pagedSets.length > 0 && pagedSets.every((s) => selected.has(s.id));
  const isIndeterminate =
    pagedSets.length > 0 && pagedSets.some((s) => selected.has(s.id)) && !allChecked;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected((prev) => {
        const next = new Set(prev);
        pagedSets.forEach((s) => next.add(s.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pagedSets.forEach((s) => next.delete(s.id));
        return next;
      });
    }
  };

  // Resizable columns state
  const [colWidths, setColWidths] = useState<Record<StandardSetColKey, number>>(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<StandardSetColKey, number>>;
        return { ...DEFAULT_COL_WIDTHS, ...parsed };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ key: StandardSetColKey; startX: number; startW: number } | null>(
    null,
  );

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(colWidths));
    } catch {
      /* ignore */
    }
  }, [colWidths]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, key: StandardSetColKey) => {
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

  // ResizeHandle: vạch đứng | 16px ở giữa header, có khoảng trống top/bottom
  const ResizeHandle = ({ colKey }: { colKey: StandardSetColKey }) => (
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

  const colClass = (extra: string = '') => `relative px-3 ${extra}`;

  const totalTableWidth = useMemo(
    () => Object.values(colWidths).reduce((a, b) => a + b, 0),
    [colWidths],
  );

  // Sort indicator icon
  const renderSortIndicator = (colKey: string) => {
    if (sortBy !== colKey) {
      return (
        <ArrowUpDown
          size={12}
          className="text-black/30 group-hover:text-[#0866db] transition-colors shrink-0"
        />
      );
    }
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-[#1683ff] shrink-0" />
    ) : (
      <ArrowDown size={12} className="text-[#1683ff] shrink-0" />
    );
  };

  // Export CSV
  const exportCsv = () => {
    const rows = filteredSets.filter((s) => (selected.size ? selected.has(s.id) : true));
    if (!rows.length) {
      setBanner({ ok: false, msg: 'Không có dữ liệu bộ tiêu chuẩn để xuất.' });
      return;
    }
    const head = ['STT', 'Ten bo tieu chuan', 'Nien khoa', 'Cap xet', 'Doi tuong', 'Ngay cong bo', 'Trang thai', 'Ngay tao'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [head.join(',')].concat(
      rows.map((r, idx) =>
        [
          idx + 1,
          esc(r.name || ''),
          esc(r.academicYear),
          esc(AWARD_LEVEL_LABELS[r.level] ?? r.level),
          esc(AWARD_TYPE_LABELS[r.awardType] ?? r.awardType),
          esc(formatDate(r.publishedAt)),
          esc(STATUS_CONFIG[r.status]?.label ?? r.status),
          esc(formatDate(r.createdAt)),
        ].join(','),
      ),
    );
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bo-tieu-chuan-sv5t-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setBanner({ ok: true, msg: `Đã xuất ${rows.length} bộ tiêu chuẩn ra tệp CSV thành công.` });
  };

  // Actions
  const handleOpenCreate = () => {
    setEditingSet(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (s: StandardSetResponse) => {
    setEditingSet(s);
    setIsFormModalOpen(true);
  };

  const handleOpenPublish = (s: StandardSetResponse) => {
    setPublishingSet(s);
    setIsPublishModalOpen(true);
  };

  const handleOpenUnpublish = (s: StandardSetResponse) => {
    setUnpublishingSet(s);
    setIsUnpublishModalOpen(true);
  };

  const handleOpenDelete = (s: StandardSetResponse) => {
    setDeletingSet(s);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (
    data: CreateStandardSetRequest | UpdateStandardSetRequest,
  ) => {
    try {
      if (editingSet) {
        await updateStandardSet.mutateAsync({
          id: editingSet.id,
          data: data as UpdateStandardSetRequest,
        });
        setBanner({ ok: true, msg: `Đã cập nhật bộ tiêu chuẩn "${data.name}".` });
      } else {
        await createStandardSet.mutateAsync(data as CreateStandardSetRequest);
        setBanner({ ok: true, msg: `Đã tạo thành công bộ tiêu chuẩn "${data.name}".` });
      }
    } catch {
      // errors handled by modal
    }
  };

  const handlePublishConfirm = async () => {
    if (!publishingSet) return;
    try {
      await publishStandardSet.mutateAsync(publishingSet.id);
      setBanner({
        ok: true,
        msg: `Đã công bố bộ tiêu chuẩn "${publishingSet.name || publishingSet.academicYear}".`,
      });
    } catch (e: unknown) {
      setBanner({ ok: false, msg: e instanceof Error ? e.message : 'Công bố thất bại.' });
    } finally {
      setIsPublishModalOpen(false);
      setPublishingSet(null);
    }
  };

  const handleUnpublishConfirm = async () => {
    if (!unpublishingSet) return;
    try {
      await unpublishStandardSet.mutateAsync(unpublishingSet.id);
      setBanner({
        ok: true,
        msg: `Đã hoàn lại bộ tiêu chuẩn "${unpublishingSet.name || unpublishingSet.academicYear}" về bản nháp.`,
      });
    } catch (e: unknown) {
      setBanner({ ok: false, msg: e instanceof Error ? e.message : 'Hoàn lại nháp thất bại.' });
    } finally {
      setIsUnpublishModalOpen(false);
      setUnpublishingSet(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSet) return;
    try {
      await deleteStandardSet.mutateAsync(deletingSet.id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deletingSet.id);
        return next;
      });
      setBanner({
        ok: true,
        msg: `Đã xóa bộ tiêu chuẩn "${deletingSet.name || deletingSet.academicYear}".`,
      });
    } catch (e: unknown) {
      setBanner({ ok: false, msg: e instanceof Error ? e.message : 'Xóa thất bại.' });
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingSet(null);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-10">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý Bộ tiêu chuẩn SV5T"
        description="Quản lý khung tiêu chuẩn và danh mục tiêu chí xét duyệt Sinh viên 5 Tốt."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#d7f0df] text-[#1c7a45] text-xs font-normal shadow-xs hover:bg-[#bfe6cc] hover:text-[#145c34] hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download size={13} strokeWidth={1.8} />
              <span>Xuất CSV{selected.size > 0 ? ` (${selected.size})` : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#a6cffb] text-[#244a7d] text-xs font-normal shadow-xs hover:bg-[#8fbff9] hover:text-[#1a3a65] hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
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
              <span>Tạo bộ tiêu chuẩn</span>
            </button>
          </div>
        }
      />

      {/* Banner */}
      {banner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            banner.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
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

      {/* 4 Stat Cards - Nhẹ nhàng, trực quan, giảm height tối đa như StudentListPage */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: FolderTree,
            label: 'Tổng bộ tiêu chuẩn',
            value: totalCount.toLocaleString('vi-VN'),
            color: 'text-blue-600 bg-blue-50',
          },
          {
            icon: CheckCircle2,
            label: 'Đã công bố',
            value: publishedCount.toLocaleString('vi-VN'),
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            icon: Edit2,
            label: 'Bản nháp',
            value: draftCount.toLocaleString('vi-VN'),
            color: 'text-amber-600 bg-amber-50',
          },
          {
            icon: BookOpenCheck,
            label: 'Danh hiệu Cá nhân',
            value: individualCount.toLocaleString('vi-VN'),
            color: 'text-violet-600 bg-violet-50',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors"
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

      {/* Unified Card: Filter + Table - Khung duy nhất y hệt StudentListPage */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        {/* Zone 1: Filter toolbar - gọn gàng, chuẩn width/height như StudentListPage */}
        <div className="px-3 sm:px-4 pt-2.5 pb-2.5 space-y-1 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="filter-no-ring flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
            {/* Search - bên trái, h-9, text-12px */}
            <div className="relative w-full lg:w-[46%] lg:max-w-[490px] shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên bộ tiêu chuẩn, năm học, cấp xét..."
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

            {/* Cụm phải: 3 selects w-[150px], h-9, text-12px */}
            <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2">
              <div className="flex w-full sm:w-auto flex-wrap sm:flex-nowrap gap-1.5">
                {/* Level filter */}
                <div className="relative w-full sm:w-[150px] shrink-0">
                  <select
                    value={levelFilter}
                    onChange={(e) =>
                      setLevelFilter(e.target.value ? (e.target.value as AwardLevel) : '')
                    }
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="">Tất cả Cấp xét</option>
                    <option value={AwardLevel.School}>{AWARD_LEVEL_LABELS[AwardLevel.School]}</option>
                    <option value={AwardLevel.City}>{AWARD_LEVEL_LABELS[AwardLevel.City]}</option>
                    <option value={AwardLevel.Central}>{AWARD_LEVEL_LABELS[AwardLevel.Central]}</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>

                {/* Award Type filter */}
                <div className="relative w-full sm:w-[150px] shrink-0">
                  <select
                    value={typeFilter}
                    onChange={(e) =>
                      setTypeFilter(e.target.value ? (e.target.value as AwardType) : '')
                    }
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="">Tất cả Đối tượng</option>
                    <option value={AwardType.Individual}>{AWARD_TYPE_LABELS[AwardType.Individual]}</option>
                    <option value={AwardType.Collective}>{AWARD_TYPE_LABELS[AwardType.Collective]}</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>

                {/* Status filter */}
                <div className="relative w-full sm:w-[150px] shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value ? (e.target.value as StandardSetStatus) : '')
                    }
                    className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                  >
                    <option value="">Tất cả Trạng thái</option>
                    <option value={StandardSetStatus.Draft}>Bản nháp</option>
                    <option value={StandardSetStatus.Published}>Đã công bố</option>
                    <option value={StandardSetStatus.Archived}>Đã lưu trữ</option>
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {filterCount > 0 && (
            <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-[11px] font-normal text-slate-500 mr-0.5">Đang lọc:</span>

              {debouncedSearch.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-600 font-normal text-[11px]">
                  "{debouncedSearch}"
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {levelFilter !== '' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                  Cấp: {AWARD_LEVEL_LABELS[levelFilter]}
                  <button
                    type="button"
                    onClick={() => setLevelFilter('')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {typeFilter !== '' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                  Đối tượng: {AWARD_TYPE_LABELS[typeFilter]}
                  <button
                    type="button"
                    onClick={() => setTypeFilter('')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {statusFilter !== '' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50/80 text-amber-700 font-normal text-[11px] border border-amber-200">
                  {STATUS_CONFIG[statusFilter]?.label ?? statusFilter}
                  <button
                    type="button"
                    onClick={() => setStatusFilter('')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-normal ml-1 cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* Short divider separating filter / table */}
        <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
        </div>

        {/* Zone 2: Table - header có handle kéo | vạch kẻ chỉ có ở header, body co giãn theo */}
        <div className="overflow-x-auto custom-scrollbar">
          <table
            className="tbl-div border-collapse text-xs table-fixed"
            style={{ width: totalTableWidth, minWidth: '100%' }}
          >
            <colgroup>
              {(Object.keys(DEFAULT_COL_WIDTHS) as StandardSetColKey[]).map((k) => (
                <col key={k} style={{ width: colWidths[k] }} />
              ))}
            </colgroup>

            {/* Table Header: neutral gray (#ECEDEF), text-black, 1 hàng thẳng tắp */}
            <thead>
              <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
                {/* 1. Checkbox */}
                <th
                  className={colClass('py-3.5 text-center')}
                  style={{ width: colWidths.check }}
                >
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
                <th
                  className={colClass(
                    'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black',
                  )}
                  style={{ width: colWidths.stt }}
                >
                  <span className="block truncate">STT</span>
                  <ResizeHandle colKey="stt" />
                </th>

                {/* 3. Tên bộ tiêu chuẩn */}
                <th
                  onClick={() => toggleSort('name')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSort('name');
                    }
                  }}
                  tabIndex={0}
                  className={colClass(
                    'py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden',
                  )}
                  style={{ width: colWidths.name }}
                  role="button"
                  aria-label="Sắp xếp theo tên bộ tiêu chuẩn"
                >
                  <div className="inline-flex items-center justify-start gap-1 max-w-full">
                    <span className="truncate">Tên bộ tiêu chuẩn</span>
                    {renderSortIndicator('name')}
                  </div>
                  <ResizeHandle colKey="name" />
                </th>

                {/* 4. Năm học */}
                <th
                  onClick={() => toggleSort('academicYear')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSort('academicYear');
                    }
                  }}
                  tabIndex={0}
                  className={colClass(
                    'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden',
                  )}
                  style={{ width: colWidths.academicYear }}
                  role="button"
                  aria-label="Sắp xếp theo năm học"
                >
                  <div className="inline-flex items-center justify-center gap-1 max-w-full">
                    <span className="truncate">Năm học</span>
                    {renderSortIndicator('academicYear')}
                  </div>
                  <ResizeHandle colKey="academicYear" />
                </th>

                {/* 5. Cấp xét */}
                <th
                  onClick={() => toggleSort('level')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSort('level');
                    }
                  }}
                  tabIndex={0}
                  className={colClass(
                    'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden',
                  )}
                  style={{ width: colWidths.level }}
                  role="button"
                  aria-label="Sắp xếp theo cấp xét"
                >
                  <div className="inline-flex items-center justify-center gap-1 max-w-full">
                    <span className="truncate">Cấp xét</span>
                    {renderSortIndicator('level')}
                  </div>
                  <ResizeHandle colKey="level" />
                </th>

                {/* 6. Đối tượng */}
                <th
                  onClick={() => toggleSort('awardType')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSort('awardType');
                    }
                  }}
                  tabIndex={0}
                  className={colClass(
                    'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden',
                  )}
                  style={{ width: colWidths.awardType }}
                  role="button"
                  aria-label="Sắp xếp theo đối tượng"
                >
                  <div className="inline-flex items-center justify-center gap-1 max-w-full">
                    <span className="truncate">Đối tượng</span>
                    {renderSortIndicator('awardType')}
                  </div>
                  <ResizeHandle colKey="awardType" />
                </th>

                {/* 7. Ngày công bố */}
                <th
                  onClick={() => toggleSort('publishedAt')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSort('publishedAt');
                    }
                  }}
                  tabIndex={0}
                  className={colClass(
                    'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden',
                  )}
                  style={{ width: colWidths.publishedAt }}
                  role="button"
                  aria-label="Sắp xếp theo ngày công bố"
                >
                  <div className="inline-flex items-center justify-center gap-1 max-w-full">
                    <span className="truncate">Ngày công bố</span>
                    {renderSortIndicator('publishedAt')}
                  </div>
                  <ResizeHandle colKey="publishedAt" />
                </th>

                {/* 8. Trạng thái - Bỏ icon, dùng dấu chấm tròn, trước Thao tác */}
                <th
                  onClick={() => toggleSort('status')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSort('status');
                    }
                  }}
                  tabIndex={0}
                  className={colClass(
                    'py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black cursor-pointer group hover:bg-black/[0.04] transition-colors whitespace-nowrap overflow-hidden',
                  )}
                  style={{ width: colWidths.status }}
                  role="button"
                  aria-label="Sắp xếp theo trạng thái"
                >
                  <div className="inline-flex items-center justify-center gap-1 max-w-full">
                    <span className="truncate">Trạng thái</span>
                    {renderSortIndicator('status')}
                  </div>
                  <ResizeHandle colKey="status" />
                </th>

                {/* 9. Thao tác */}
                <th
                  className="relative px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black whitespace-nowrap overflow-hidden"
                  style={{ width: colWidths.actions }}
                >
                  <span className="block truncate">Thao tác</span>
                </th>
              </tr>
            </thead>

            {/* Table Body - sạch sẽ, không có vạch dọc, hover hiệu ứng chỉ viền xanh nhẹ */}
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
                        <div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3.5 bg-slate-200 rounded w-20 mx-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3.5 bg-slate-200 rounded w-16 mx-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3.5 bg-slate-200 rounded w-24 mx-auto" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-5 bg-slate-200 rounded-full w-24 mx-auto" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="h-7 bg-slate-200 rounded w-24 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* Error State */}
              {!isPending && isError && (
                <tr>
                  <td colSpan={9} className="py-10 text-center">
                    <div className="space-y-2">
                      <AlertCircle size={24} className="text-rose-500 mx-auto" />
                      <div className="text-sm font-medium text-slate-700">
                        Không thể tải danh sách bộ tiêu chuẩn
                      </div>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {error instanceof Error ? error.message : 'Đã có lỗi kết nối đến máy chủ.'}
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
              {!isPending && !isError && filteredSets.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="space-y-2">
                      <FolderTree size={36} className="mx-auto text-slate-300" />
                      <div className="text-sm font-medium text-slate-600">
                        Chưa có bộ tiêu chuẩn nào phù hợp
                      </div>
                      <p className="text-xs text-slate-400">
                        {filterCount > 0
                          ? 'Thử thay đổi từ khóa hoặc điều chỉnh tiêu chí bộ lọc.'
                          : 'Bấm "Tạo bộ tiêu chuẩn" để thiết lập bộ khung mới.'}
                      </p>
                      {filterCount > 0 && (
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
              {!isPending &&
                !isError &&
                pagedSets.map((item, idx) => {
                  const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG[StandardSetStatus.Draft];
                  const displayName = item.name?.trim() || '';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6]"
                    >
                      {/* 1. Checkbox */}
                      <td
                        className="px-3 py-2.5 text-center align-middle overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).tagName !== 'INPUT') {
                            toggleOne(item.id);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleOne(item.id)}
                          className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer align-middle"
                          aria-label={`Chọn ${displayName || `bộ tiêu chuẩn ${item.academicYear}`}`}
                        />
                      </td>

                      {/* 2. STT */}
                      <td className="px-2 py-3 text-center align-middle text-slate-500 text-[11px] overflow-hidden whitespace-nowrap">
                        {(effectivePageIndex - 1) * effectivePageSize + idx + 1}
                      </td>

                      {/* 3. Tên bộ tiêu chuẩn - nếu chưa có tên thì hiện blank khoảng trống */}
                      <td className="px-3 py-2.5 text-left align-middle overflow-hidden whitespace-nowrap">
                        {displayName ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/standards/${item.id}`)}
                            className="cursor-pointer block text-left max-w-full truncate group/name"
                            title={displayName}
                          >
                            <span className="text-[13px] font-normal text-slate-800 group-hover/name:text-[#1683ff] transition-colors truncate block">
                              {displayName}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/standards/${item.id}`)}
                            className="cursor-pointer block w-full text-left h-5"
                            title="Chưa đặt tên bộ tiêu chuẩn (Bấm để xem chi tiết)"
                          >
                            <span className="block select-none text-transparent">&nbsp;</span>
                          </button>
                        )}
                      </td>

                      {/* 4. Năm học - chữ dài hiện ... */}
                      <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                        <span className="block truncate text-xs font-normal" title={item.academicYear}>
                          {item.academicYear}
                        </span>
                      </td>

                      {/* 5. Cấp xét - chữ thường, không background màu sắc, dài hiện ... */}
                      <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                        <span
                          className="block truncate text-xs font-normal"
                          title={AWARD_LEVEL_LABELS[item.level] ?? item.level}
                        >
                          {AWARD_LEVEL_LABELS[item.level] ?? item.level}
                        </span>
                      </td>

                      {/* 6. Đối tượng - chữ thường, không background màu sắc, dài hiện ... */}
                      <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                        <span
                          className="block truncate text-xs font-normal"
                          title={AWARD_TYPE_LABELS[item.awardType] ?? item.awardType}
                        >
                          {AWARD_TYPE_LABELS[item.awardType] ?? item.awardType}
                        </span>
                      </td>

                      {/* 7. Ngày công bố - chữ dài hiện ... */}
                      <td className="px-3 py-2.5 text-center align-middle text-slate-700 whitespace-nowrap overflow-hidden">
                        <span
                          className="block truncate text-xs font-normal"
                          title={formatDate(item.publishedAt)}
                        >
                          {formatDate(item.publishedAt)}
                        </span>
                      </td>

                      {/* 8. Trạng thái - Bỏ icon, dùng dấu chấm, đặt sau ngày công bố và trước thao tác */}
                      <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap overflow-hidden">
                        <div className="inline-flex justify-center max-w-full overflow-hidden whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-full border text-[11px] font-medium whitespace-nowrap max-w-full overflow-hidden ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                            title={statusCfg.label}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} shrink-0`} />
                            <span className="truncate">{statusCfg.label}</span>
                          </span>
                        </div>
                      </td>

                      {/* 9. Thao tác - menu 3 dấu chấm (kebab/hamburger), click mở danh sách chức năng */}
                      <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap overflow-hidden">
                        <div className="inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => handleOpenMenu(e, item)}
                            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                              menuOpenFor?.item.id === item.id
                                ? 'bg-blue-50 text-[#1683ff] border-blue-200 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent hover:border-slate-200'
                            }`}
                            title="Thao tác"
                            aria-label={`Thao tác cho ${displayName || item.academicYear}`}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - gọn hiện đại: Tổng số | Số dòng/trang | range | 4 nút điều hướng */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500 border-t border-slate-100 bg-slate-50/50">
          <span className="font-normal">
            Tổng số: <span className="font-semibold text-slate-700">{total}</span>
            {selected.size > 0 && (
              <span className="ml-2 font-medium text-blue-600">
                · Đã chọn {selected.size} dòng
              </span>
            )}
          </span>

          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-slate-400 hover:text-rose-600 cursor-pointer text-[11px] ml-1 transition-colors"
            >
              Bỏ chọn tất cả
            </button>
          )}

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

      {/* Standard Set Modal (Create / Edit) */}
      <StandardSetFormModal
        isOpen={isFormModalOpen}
        standardSet={editingSet}
        existingSets={standardSets}
        isLoading={createStandardSet.isPending || updateStandardSet.isPending}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Publish Confirm Modal */}
      <AdminConfirmDialog
        isOpen={isPublishModalOpen}
        title="Công bố Bộ tiêu chuẩn"
        description={`Bạn có chắc chắn muốn công bố (Publish) bộ tiêu chuẩn "${publishingSet?.name || publishingSet?.academicYear}" (${publishingSet ? AWARD_LEVEL_LABELS[publishingSet.level] : ''})?\n\nLưu ý: Sau khi công bố, bộ tiêu chuẩn có thể gắn vào các đợt xét duyệt.`}
        confirmText="Xác nhận công bố"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={publishStandardSet.isPending}
        onConfirm={handlePublishConfirm}
        onClose={() => setIsPublishModalOpen(false)}
      />

      {/* Unpublish Confirm Modal */}
      <AdminConfirmDialog
        isOpen={isUnpublishModalOpen}
        title="Hoàn lại về bản nháp"
        description={`Bạn có chắc chắn muốn hoàn lại bộ tiêu chuẩn "${unpublishingSet?.name || unpublishingSet?.academicYear}" về trạng thái Bản nháp (Draft)?\n\nSau khi hoàn lại, bạn có thể tự do chỉnh sửa cây tiêu chí hoặc xóa bỏ bộ tiêu chuẩn này.`}
        confirmText="Hoàn lại về nháp"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={unpublishStandardSet.isPending}
        onConfirm={handleUnpublishConfirm}
        onClose={() => setIsUnpublishModalOpen(false)}
      />

      {/* Delete Confirm Modal */}
      <AdminConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Xóa bộ tiêu chuẩn nháp"
        description={`Bạn có chắc chắn muốn xóa bộ tiêu chuẩn "${deletingSet?.name || deletingSet?.academicYear}"?\n\nToàn bộ các tiêu chí trong bộ tiêu chuẩn này cũng sẽ bị xóa. Thao tác này không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteStandardSet.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* Action Menu Dropdown Portal */}
      {menuOpenFor &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: menuOpenFor.top,
              left: menuOpenFor.left,
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[195px] bg-white rounded-xl border border-slate-200/90 shadow-xl py-1.5 px-1 animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            {/* 1. Xem chi tiết */}
            <button
              type="button"
              onClick={() => {
                const id = menuOpenFor.item.id;
                closeMenu();
                navigate(`/admin/standards/${id}`);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-blue-50/70 hover:text-[#1683ff] rounded-lg transition-colors cursor-pointer group"
            >
              <Eye size={14} className="text-blue-500 group-hover:text-[#1683ff] shrink-0" />
              <span>Xem chi tiết</span>
            </button>

            {/* Khi ở trạng thái Bản nháp (Draft) */}
            {menuOpenFor.item.status === StandardSetStatus.Draft && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const it = menuOpenFor.item;
                    closeMenu();
                    handleOpenPublish(it);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer group"
                >
                  <Upload size={14} className="text-emerald-600 group-hover:text-emerald-700 shrink-0" />
                  <span>Công bố bộ tiêu chuẩn</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const it = menuOpenFor.item;
                    closeMenu();
                    handleOpenEdit(it);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors cursor-pointer group"
                >
                  <Edit2 size={14} className="text-slate-500 group-hover:text-slate-700 shrink-0" />
                  <span>Chỉnh sửa thông tin</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    const it = menuOpenFor.item;
                    closeMenu();
                    handleOpenDelete(it);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer group"
                >
                  <Trash2 size={14} className="text-rose-500 group-hover:text-rose-600 shrink-0" />
                  <span>Xóa bộ tiêu chuẩn</span>
                </button>
              </>
            )}

            {/* Khi ở trạng thái Đã công bố (Published) */}
            {menuOpenFor.item.status === StandardSetStatus.Published && (
              <button
                type="button"
                onClick={() => {
                  const it = menuOpenFor.item;
                  closeMenu();
                  handleOpenUnpublish(it);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded-lg transition-colors cursor-pointer group"
              >
                <RotateCcw size={14} className="text-amber-600 group-hover:text-amber-700 shrink-0" />
                <span>Hoàn lại về nháp</span>
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
