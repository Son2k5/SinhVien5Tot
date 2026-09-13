import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AwardLevel,
  CampaignStatus,
  type CampaignFilterParams,
  type CampaignResponse,
  type CreateCampaignRequest,
  type UpdateCampaignRequest,
} from '../../types/admin/campaign';
import {
  useCampaignMutations,
  useCampaignsPaged,
} from '../../hooks/admin/useCampaigns';
import {
  AwardLevelBadge,
  AwardTypeBadge,
  CampaignStatusBadge,
} from '../../components/admin/AdminStatusBadge';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { CampaignFormModal } from '../../components/admin/CampaignFormModal';
import { CampaignStatusModal } from '../../components/admin/CampaignStatusModal';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  Files,
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

export function CampaignListPage() {
  const navigate = useNavigate();

  // Filters state
  const [level, setLevel] = useState<AwardLevel | ''>('');
  const [status, setStatus] = useState<CampaignStatus | ''>('');
  const [schoolYear, setSchoolYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;

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
  } = useCampaignMutations();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignResponse | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusCampaign, setStatusCampaign] = useState<CampaignResponse | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<CampaignResponse | null>(null);

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
    await deleteCampaign.mutateAsync(deletingCampaign.id);
    setIsDeleteModalOpen(false);
    setDeletingCampaign(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3.5 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <AdminPageHeader
        title="Chiến dịch SV5T"
        description="Quản lý thời hạn, bộ tiêu chuẩn và tiến độ các đợt xét duyệt Sinh viên 5 tốt."
        breadcrumbs={[{ label: 'Chiến dịch' }]}
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-8.5 px-3 rounded-lg font-medium text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
          >
            <Plus size={14} />
            <span>Tạo chiến dịch</span>
          </button>
        }
      />

      {/* Streamlined & Minimalist Filter Bar */}
      <section className="p-2 sm:p-2.5 border border-slate-200/90 rounded-xl bg-white shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          {/* Search Box - Primary focus */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên chiến dịch, năm học..."
              aria-label="Tìm theo tên chiến dịch, năm học"
              className="w-full h-8.5 pl-8 pr-7 text-xs border border-slate-200 rounded-lg bg-slate-50/60 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                title="Xóa tìm kiếm"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Inputs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Level Filter */}
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value ? (e.target.value as AwardLevel) : '');
                setPageIndex(1);
              }}
              className={`h-8.5 px-2.5 text-xs border rounded-lg outline-none cursor-pointer transition-all ${
                level
                  ? 'border-blue-300 bg-blue-50/60 text-blue-800 font-medium'
                  : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100/70 focus:border-blue-500 focus:bg-white'
              }`}
            >
              <option value="">Cấp xét: Tất cả</option>
              <option value={AwardLevel.School}>Cấp Trường</option>
              <option value={AwardLevel.City}>Cấp Thành phố</option>
              <option value={AwardLevel.Central}>Cấp Trung ương</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(
                  e.target.value ? (e.target.value as CampaignStatus) : '',
                );
                setPageIndex(1);
              }}
              className={`h-8.5 px-2.5 text-xs border rounded-lg outline-none cursor-pointer transition-all ${
                status
                  ? 'border-blue-300 bg-blue-50/60 text-blue-800 font-medium'
                  : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100/70 focus:border-blue-500 focus:bg-white'
              }`}
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value={CampaignStatus.Draft}>Bản nháp</option>
              <option value={CampaignStatus.Open}>Đang mở đăng ký</option>
              <option value={CampaignStatus.Closed}>Đã đóng đăng ký</option>
              <option value={CampaignStatus.Reviewing}>Đang xét duyệt</option>
              <option value={CampaignStatus.Published}>Đã công bố</option>
              <option value={CampaignStatus.Archived}>Đã lưu trữ</option>
            </select>

            {/* School Year Filter */}
            <div className="relative w-full sm:w-36">
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => {
                  setSchoolYear(e.target.value);
                  setPageIndex(1);
                }}
                placeholder="Năm học (VD: 25-26)"
                className={`w-full h-8.5 px-2.5 text-xs border rounded-lg outline-none transition-all ${
                  schoolYear.trim()
                    ? 'border-blue-300 bg-blue-50/60 text-blue-800 font-medium pr-6'
                    : 'border-slate-200 bg-slate-50/60 text-slate-800 placeholder:text-slate-400 hover:bg-slate-100/70 focus:border-blue-500 focus:bg-white'
                }`}
              />
              {schoolYear && (
                <button
                  type="button"
                  onClick={() => {
                    setSchoolYear('');
                    setPageIndex(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-8.5 px-2.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Xóa toàn bộ bộ lọc"
                >
                  <RotateCcw size={11} />
                  <span>Xóa lọc ({activeFilterCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void refetch()}
                className="h-8.5 px-2.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                title="Làm mới danh sách"
              >
                <RefreshCw size={11} className={isPending ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Table Card */}
      <section className="border border-slate-200/90 rounded-xl bg-white shadow-xs overflow-hidden">
        {/* Loading Skeleton */}
        {isPending && (
          <div className="p-4 space-y-3 animate-pulse">
            <div className="h-9 bg-slate-100 rounded-lg" />
            <div className="h-12 bg-slate-50 rounded-lg" />
            <div className="h-12 bg-slate-50 rounded-lg" />
            <div className="h-12 bg-slate-50 rounded-lg" />
            <div className="h-12 bg-slate-50 rounded-lg" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-8 text-center space-y-3">
            <AlertCircle size={28} className="mx-auto text-rose-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Không thể tải danh sách đợt xét
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đã có lỗi xảy ra trong quá trình kết nối đến máy chủ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RefreshCw size={12} /> Thử lại
            </button>
          </div>
        )}

        {/* Data Table */}
        {!isPending && !isError && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="border-b border-blue-100 bg-[#edf5fc]">
                    <th className="py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-blue-950/80 text-left min-w-[220px]">
                      Chiến dịch & Niên khóa
                    </th>
                    <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-blue-950/80 text-center w-[110px]">
                      Cấp xét
                    </th>
                    <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-blue-950/80 text-center w-[100px]">
                      Đối tượng
                    </th>
                    <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-blue-950/80 text-center w-[130px]">
                      Trạng thái
                    </th>
                    <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-blue-950/80 text-center w-[130px]">
                      Bộ tiêu chuẩn
                    </th>
                    <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-blue-950/80 text-center w-[115px]">
                      Hạn đăng ký
                    </th>
                    <th className="py-2.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-blue-950/80 text-center w-[115px]">
                      Hạn xét duyệt
                    </th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-blue-950/80 text-center w-[110px]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Files size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-semibold text-slate-700">
                          Không tìm thấy đợt xét nào phù hợp
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Thử thay đổi bộ lọc hoặc tạo mới một chiến dịch SV5T.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((campaign) => {
                      const isDraft = campaign.status === CampaignStatus.Draft;
                      const isClosedOrArchived =
                        campaign.status === CampaignStatus.Closed ||
                        campaign.status === CampaignStatus.Archived;

                      return (
                        <tr
                          key={campaign.id}
                          className="hover:bg-blue-50/25 transition-colors group"
                        >
                          {/* 1. Chiến dịch & Niên khóa (Left aligned) */}
                          <td className="py-3 px-3.5 align-middle">
                            <div className="space-y-0.5">
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                                className="text-xs sm:text-[13px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-left cursor-pointer line-clamp-1 block"
                                title={campaign.name}
                              >
                                {campaign.name}
                              </button>
                              <div className="text-[11px] text-slate-500">
                                <span>Năm học: <span className="font-medium text-slate-700">{campaign.schoolYear}</span></span>
                                {campaign.prerequisiteCampaignName && (
                                  <span className="text-slate-400 ml-2">
                                    · Tiên quyết: <span className="text-slate-600 font-medium">{campaign.prerequisiteCampaignName}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Cấp xét (Center aligned) */}
                          <td className="py-3 px-2.5 align-middle text-center">
                            <div className="flex items-center justify-center">
                              <AwardLevelBadge level={campaign.level} />
                            </div>
                          </td>

                          {/* 3. Đối tượng / Loại (Center aligned) */}
                          <td className="py-3 px-2.5 align-middle text-center">
                            <div className="flex items-center justify-center">
                              <AwardTypeBadge awardType={campaign.awardType} />
                            </div>
                          </td>

                          {/* 4. Trạng thái (Center aligned) */}
                          <td className="py-3 px-2.5 align-middle text-center">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleOpenStatus(campaign)}
                                className="cursor-pointer hover:scale-105 transition-transform inline-flex"
                                title="Bấm để cập nhật trạng thái"
                              >
                                <CampaignStatusBadge status={campaign.status} />
                              </button>
                            </div>
                          </td>

                          {/* 5. Bộ tiêu chuẩn (Center aligned) */}
                          <td className="py-3 px-2.5 align-middle text-center">
                            <div className="text-xs font-medium text-slate-700">
                              {campaign.standardSetName ? (
                                <span title={campaign.standardSetName}>
                                  {campaign.standardSetName}
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400 text-[11px]">
                                  ID: {campaign.standardSetId.slice(0, 8)}...
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Hạn đăng ký (Center aligned) */}
                          <td className="py-3 px-2.5 align-middle text-center">
                            <div className="text-xs font-medium text-slate-700">
                              {formatDate(campaign.regCloseAt)}
                            </div>
                          </td>

                          {/* 7. Hạn xét duyệt (Center aligned) */}
                          <td className="py-3 px-2.5 align-middle text-center">
                            <div className="text-xs font-medium text-slate-700">
                              {formatDate(campaign.reviewDeadline)}
                            </div>
                          </td>

                          {/* 8. Thao tác (Center aligned) */}
                          <td className="py-3 px-3 align-middle text-center">
                            <div className="inline-flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Xem chi tiết chiến dịch"
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(campaign)}
                                disabled={isClosedOrArchived}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  isClosedOrArchived
                                    ? 'Không thể sửa chiến dịch đã đóng hoặc lưu trữ'
                                    : 'Chỉnh sửa đợt xét'
                                }
                              >
                                <Edit2 size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDelete(campaign)}
                                disabled={!isDraft}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  isDraft
                                    ? 'Xoá chiến dịch nháp'
                                    : 'Chỉ có thể xoá chiến dịch ở trạng thái Nháp (Draft)'
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {data && data.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                <div>
                  Hiển thị {(data.pageIndex - 1) * data.pageSize + 1} -{' '}
                  {Math.min(data.pageIndex * data.pageSize, data.totalCount)} trong tổng số{' '}
                  <strong className="text-slate-800">{data.totalCount}</strong> đợt xét
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={data.pageIndex <= 1}
                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-700">
                    Trang {data.pageIndex} / {data.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={data.pageIndex >= data.totalPages}
                    onClick={() => setPageIndex((p) => p + 1)}
                    className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

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
        description={`Bạn có chắc chắn muốn xoá chiến dịch "${deletingCampaign?.name}"?\n\nLưu ý: Chỉ chiến dịch ở trạng thái Nháp và chưa phát sinh hồ sơ đăng ký mới có thể xoá. Thao tác này không thể hoàn tác.`}
        confirmText="Xác nhận xoá"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteCampaign.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}

