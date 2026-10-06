import { useState, useMemo } from 'react';
import {
  AwardLevel,
  CampaignStatus,
  type CampaignFilterParams,
  type CampaignResponse,
  type CreateCampaignRequest,
  type UpdateCampaignRequest,
} from '../types/campaign.types';
import { useCampaignMutations, useCampaignsPaged } from './useCampaigns';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';

const DEFAULT_PAGE_SIZE = 10;

export function useCampaignList() {
  // Filters state
  const [level, setLevel] = useState<AwardLevel | ''>('');
  const [status, setStatus] = useState<CampaignStatus | ''>('');
  const [schoolYear, setSchoolYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Checkbox selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignResponse | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusCampaign, setStatusCampaign] = useState<CampaignResponse | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<CampaignResponse | null>(null);

  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);

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

  return {
    // Filter states
    level,
    setLevel,
    status,
    setStatus,
    schoolYear,
    setSchoolYear,
    searchQuery,
    setSearchQuery,
    pageIndex,
    setPageIndex,
    pageSize,
    handlePageSizeChange,
    activeFilterCount,
    handleResetFilters,

    // Data
    items,
    total,
    totalPages,
    effectivePageSize,
    effectivePageIndex,
    rangeFrom,
    rangeTo,
    canPrev,
    canNext,
    isPending,
    isError,
    refetch,

    // Selection
    selected,
    toggleOne,
    toggleAll,

    // Banner
    banner,
    setBanner,

    // Modal states & handlers
    isFormModalOpen,
    setIsFormModalOpen,
    editingCampaign,
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    isFormLoading: createCampaign.isPending || updateCampaign.isPending,

    isStatusModalOpen,
    setIsStatusModalOpen,
    statusCampaign,
    handleOpenStatus,
    handleStatusSave,
    isStatusLoading: updateCampaignStatus.isPending,

    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deletingCampaign,
    handleOpenDelete,
    handleDeleteConfirm,
    isDeleteLoading: deleteCampaign.isPending,

    isBatchDeleteModalOpen,
    setIsBatchDeleteModalOpen,
    handleBatchDeleteConfirm,
    isBatchDeleteLoading: batchDeleteCampaigns.isPending,
  };
}
