import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AwardLevel,
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
import {
  AwardLevelBadge,
  AwardTypeBadge,
  StandardSetStatusBadge,
} from '../../components/admin/AdminStatusBadge';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { StandardSetFormModal } from '../../components/admin/StandardSetFormModal';
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Edit2,
  FolderTree,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';

export function StandardSetListPage() {

  const navigate = useNavigate();

  const { data: standardSets = [], isPending, isError, refetch } = useStandardSets();
  const {
    createStandardSet,
    updateStandardSet,
    deleteStandardSet,
    publishStandardSet,
    unpublishStandardSet,
  } = useStandardSetMutations();

  // Filters
  const [levelFilter, setLevelFilter] = useState<AwardLevel | ''>('');
  const [statusFilter, setStatusFilter] = useState<StandardSetStatus | ''>('');
  const [yearFilter, setYearFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<StandardSetResponse | null>(null);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishingSet, setPublishingSet] = useState<StandardSetResponse | null>(null);

  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [unpublishingSet, setUnpublishingSet] = useState<StandardSetResponse | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSet, setDeletingSet] = useState<StandardSetResponse | null>(null);

  const filteredSets = useMemo(() => {
    return standardSets.filter((s) => {
      if (levelFilter !== '' && s.level !== levelFilter) return false;
      if (statusFilter !== '' && s.status !== statusFilter) return false;
      if (yearFilter.trim() && !s.academicYear.toLowerCase().includes(yearFilter.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.academicYear.toLowerCase().includes(q) ||
          AWARD_LEVEL_LABELS[s.level].toLowerCase().includes(q) ||
          AWARD_TYPE_LABELS[s.awardType].toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [standardSets, levelFilter, statusFilter, yearFilter, searchQuery]);

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
    if (editingSet) {
      await updateStandardSet.mutateAsync({
        id: editingSet.id,
        data: data as UpdateStandardSetRequest,
      });
    } else {
      await createStandardSet.mutateAsync(data as CreateStandardSetRequest);
    }
  };

  const handlePublishConfirm = async () => {
    if (!publishingSet) return;
    await publishStandardSet.mutateAsync(publishingSet.id);
    setIsPublishModalOpen(false);
    setPublishingSet(null);
  };

  const handleUnpublishConfirm = async () => {
    if (!unpublishingSet) return;
    await unpublishStandardSet.mutateAsync(unpublishingSet.id);
    setIsUnpublishModalOpen(false);
    setUnpublishingSet(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSet) return;
    await deleteStandardSet.mutateAsync(deletingSet.id);
    setIsDeleteModalOpen(false);
    setDeletingSet(null);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <AdminPageHeader
        title="Bộ tiêu chuẩn SV5T"
        description="Quản lý khung tiêu chuẩn và cây tiêu chí xét duyệt theo từng năm học."
        breadcrumbs={[{ label: 'Cấu hình tiêu chuẩn' }]}
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-9 px-3.5 rounded-lg font-medium text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus size={15} />
            <span>Tạo bộ tiêu chuẩn</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <section className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <BookOpenCheck size={14} className="text-blue-600" />
            <span>Bộ lọc danh sách</span>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Làm mới</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo năm học, cấp..."
              className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-colors"
            />
          </div>

          <div>
            <select
              value={levelFilter}
              onChange={(e) =>
                setLevelFilter(
                  e.target.value ? (e.target.value as AwardLevel) : '',
                )
              }
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:border-blue-500 focus:bg-white outline-none cursor-pointer transition-colors"
            >
              <option value="">Tất cả Cấp xét duyệt</option>
              <option value={AwardLevel.School}>Cấp Trường</option>
              <option value={AwardLevel.City}>Cấp Thành phố</option>
              <option value={AwardLevel.Central}>Cấp Trung ương</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value ? (e.target.value as StandardSetStatus) : '',
                )
              }
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:border-blue-500 focus:bg-white outline-none cursor-pointer transition-colors"
            >
              <option value="">Tất cả Trạng thái</option>
              <option value={StandardSetStatus.Draft}>Bản nháp</option>
              <option value={StandardSetStatus.Published}>Đã công bố</option>
              <option value={StandardSetStatus.Archived}>Đã lưu trữ</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              placeholder="Năm học (VD: 2025-2026)"
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Main Grid / List */}
      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-pulse">
          <div className="h-44 bg-slate-100 rounded-xl" />
          <div className="h-44 bg-slate-100 rounded-xl" />
          <div className="h-44 bg-slate-100 rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle size={32} className="mx-auto text-rose-500" />
          <h3 className="text-sm font-semibold text-rose-900">Không thể tải danh sách tiêu chuẩn</h3>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3.5 py-1.5 text-xs font-medium text-rose-800 bg-white border border-rose-300 rounded-lg hover:bg-rose-50 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {!isPending && !isError && filteredSets.length === 0 && (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 space-y-2">
          <FolderTree size={36} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-800">Chưa có bộ tiêu chuẩn nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Bấm "Tạo bộ tiêu chuẩn" để thiết lập bộ khung mới hoặc nhân bản từ các năm trước.
          </p>
        </div>
      )}

      {!isPending && !isError && filteredSets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSets.map((item) => {
            const isDraft = item.status === StandardSetStatus.Draft;
            const isPublished = item.status === StandardSetStatus.Published;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3.5 flex flex-col justify-between hover:border-slate-300 transition-colors group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <StandardSetStatusBadge status={item.status} />
                    <span className="text-xs text-slate-400 font-normal">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      Năm học {item.academicYear}
                    </h3>
                    <div className="flex items-center gap-1.5 pt-1">
                      <AwardLevelBadge level={item.level} />
                      <AwardTypeBadge awardType={item.awardType} />
                    </div>
                  </div>

                  {isPublished && item.publishedAt && (
                    <div className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                      <span>Đã công bố ngày {formatDate(item.publishedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/standards/${item.id}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Cây tiêu chí</span>
                    <ChevronRight size={13} />
                  </button>

                  <div className="inline-flex items-center gap-1">
                    {isPublished && (
                      <button
                        type="button"
                        onClick={() => handleOpenUnpublish(item)}
                        className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                        title="Hoàn lại về bản nháp để chỉnh sửa / xóa"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}

                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => handleOpenPublish(item)}
                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        title="Công bố bộ tiêu chuẩn"
                      >
                        <Sparkles size={14} />
                      </button>
                    )}

                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}

                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(item)}
                        className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="Xóa bộ tiêu chuẩn"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standard Set Modal */}
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
        description={`Bạn có chắc chắn muốn công bố (Publish) bộ tiêu chuẩn năm học ${publishingSet?.academicYear} (${publishingSet ? AWARD_LEVEL_LABELS[publishingSet.level] : ''})?\n\nLưu ý: Sau khi công bố, bộ tiêu chuẩn có thể gắn vào các đợt xét.`}
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
        description={`Bạn có chắc chắn muốn hoàn lại bộ tiêu chuẩn năm học ${unpublishingSet?.academicYear} về trạng thái Bản nháp (Draft)?\n\nSau khi hoàn lại, bạn có thể tự do chỉnh sửa cây tiêu chí hoặc xóa bỏ bộ tiêu chuẩn này.`}
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
        description={`Bạn có chắc chắn muốn xóa bộ tiêu chuẩn năm học ${deletingSet?.academicYear}?\n\nToàn bộ các tiêu chí trong bộ tiêu chuẩn này cũng sẽ bị xóa. Thao tác này không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteStandardSet.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
