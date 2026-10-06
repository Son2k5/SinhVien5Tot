import { useState, useMemo, useEffect, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import {
  AwardLevel,
  AwardType,
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
} from '../../campaigns/types/campaign.types';
import {
  StandardSetStatus,
  type CreateStandardSetRequest,
  type StandardSetResponse,
  type UpdateStandardSetRequest,
} from '../types/standard.types';
import { useStandardSetMutations, useStandardSets } from './useStandards';

const DEFAULT_PAGE_SIZE = 12;

export function useStandardSetList() {
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

  // Action dropdown menu (kebab)
  const [menuOpenFor, setMenuOpenFor] = useState<{
    item: StandardSetResponse;
    top: number;
    left: number;
  } | null>(null);

  const handleOpenMenu = (
    e: ReactMouseEvent<HTMLButtonElement>,
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

  // Pagination
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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

  // Checkbox selection
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (on: boolean) => {
    setSelected(on ? new Set(pagedSets.map((s) => s.id)) : new Set());
  };

  // Modal open handlers
  const handleOpenCreate = () => {
    setEditingSet(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: StandardSetResponse) => {
    setEditingSet(item);
    setIsFormModalOpen(true);
  };

  const handleOpenPublish = (item: StandardSetResponse) => {
    setPublishingSet(item);
    setIsPublishModalOpen(true);
  };

  const handleOpenUnpublish = (item: StandardSetResponse) => {
    setUnpublishingSet(item);
    setIsUnpublishModalOpen(true);
  };

  const handleOpenDelete = (item: StandardSetResponse) => {
    setDeletingSet(item);
    setIsDeleteModalOpen(true);
  };

  // Submit handlers
  const handleFormSubmit = async (data: CreateStandardSetRequest | UpdateStandardSetRequest) => {
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

  const exportCsv = () => {
    const listToExport =
      selected.size > 0
        ? standardSets.filter((s) => selected.has(s.id))
        : filteredSets;

    if (listToExport.length === 0) {
      setBanner({ ok: false, msg: 'Không có dữ liệu để xuất CSV.' });
      return;
    }

    const headers = [
      'STT',
      'Tên bộ tiêu chuẩn',
      'Năm học',
      'Cấp xét',
      'Đối tượng',
      'Trạng thái',
      'Ngày công bố',
      'Ngày tạo',
    ];

    const rows = listToExport.map((s, idx) => [
      idx + 1,
      `"${(s.name || `Bộ tiêu chuẩn ${s.academicYear}`).replace(/"/g, '""')}"`,
      s.academicYear,
      AWARD_LEVEL_LABELS[s.level] || s.level,
      AWARD_TYPE_LABELS[s.awardType] || s.awardType,
      s.status === StandardSetStatus.Published
        ? 'Đã công bố'
        : s.status === StandardSetStatus.Draft
        ? 'Bản nháp'
        : 'Đã lưu trữ',
      s.publishedAt ? new Date(s.publishedAt).toLocaleDateString('vi-VN') : '',
      new Date(s.createdAt).toLocaleDateString('vi-VN'),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_bo_tieu_chuan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    // Data & state
    standardSets,
    filteredSets,
    pagedSets,
    total,
    totalPages,
    effectivePageIndex,
    effectivePageSize,
    rangeFrom,
    rangeTo,
    canPrev,
    canNext,
    setPageIndex,
    pageSize,
    handlePageSizeChange,
    isPending,
    isError,
    error,
    refetch,

    // Stats
    totalCount,
    publishedCount,
    draftCount,
    individualCount,
    filterCount,

    // Filters
    searchQuery,
    setSearchQuery,
    levelFilter,
    setLevelFilter,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    handleResetFilters,

    // Sorting
    sortBy,
    sortDir,
    toggleSort,

    // Selection
    selected,
    toggleOne,
    toggleAll,
    setSelected,

    // Banner
    banner,
    setBanner,

    // Kebab Menu
    menuOpenFor,
    handleOpenMenu,
    closeMenu,

    // Modals & Handlers
    isFormModalOpen,
    setIsFormModalOpen,
    editingSet,
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    isFormLoading: createStandardSet.isPending || updateStandardSet.isPending,

    isPublishModalOpen,
    setIsPublishModalOpen,
    publishingSet,
    handleOpenPublish,
    handlePublishConfirm,
    isPublishLoading: publishStandardSet.isPending,

    isUnpublishModalOpen,
    setIsUnpublishModalOpen,
    unpublishingSet,
    handleOpenUnpublish,
    handleUnpublishConfirm,
    isUnpublishLoading: unpublishStandardSet.isPending,

    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deletingSet,
    handleOpenDelete,
    handleDeleteConfirm,
    isDeleteLoading: deleteStandardSet.isPending,

    exportCsv,
  };
}
