import { useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/common/AdminConfirmDialog';
import {
  useStandardSetList,
  StandardSetStatsCards,
  StandardSetFilterBar,
  StandardSetTable,
  StandardSetPagination,
  StandardSetActionMenu,
  StandardSetFormModal,
} from '../../features/standards';

export function StandardSetListPage() {
  const navigate = useNavigate();
  const {
    // Data & state
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
    setSelected,
    toggleOne,
    toggleAll,

    // Kebab Menu
    menuOpenFor,
    handleOpenMenu,
    closeMenu,

    // Modals
    isFormModalOpen,
    setIsFormModalOpen,
    editingSet,
    handleOpenCreate,
    handleOpenEdit,
    handleFormSubmit,
    isFormLoading,

    isPublishModalOpen,
    setIsPublishModalOpen,
    publishingSet,
    handleOpenPublish,
    handlePublishConfirm,
    isPublishLoading,

    isUnpublishModalOpen,
    setIsUnpublishModalOpen,
    unpublishingSet,
    handleOpenUnpublish,
    handleUnpublishConfirm,
    isUnpublishLoading,

    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deletingSet,
    handleOpenDelete,
    handleDeleteConfirm,
    isDeleteLoading,

    exportCsv,
  } = useStandardSetList();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
      <AdminPageHeader
        title="Quản lý Bộ tiêu chuẩn"
        description="Định nghĩa khung tiêu chí, thang điểm và chỉ số đánh giá cho từng danh hiệu Sinh viên 5 tốt."
        breadcrumbs={[{ label: 'Bộ tiêu chuẩn' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="h-9 px-3.5 rounded-lg border border-slate-200 bg-white font-medium text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Download size={14} className="text-slate-500" />
              <span>Xuất dữ liệu</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-9 px-3.5 rounded-lg bg-sky-500 font-medium text-xs text-white hover:bg-sky-600 active:scale-95 shadow-sm shadow-sky-500/25 inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus size={15} />
              <span>Tạo bộ tiêu chuẩn</span>
            </button>
          </div>
        }
      />

      <StandardSetStatsCards
        totalCount={totalCount}
        publishedCount={publishedCount}
        draftCount={draftCount}
        individualCount={individualCount}
      />

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <StandardSetFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          levelFilter={levelFilter}
          onLevelChange={setLevelFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          filterCount={filterCount}
          onReset={handleResetFilters}
        />

        <StandardSetTable
          items={pagedSets}
          isPending={isPending}
          isError={isError}
          errorMessage={error ? (error as Error).message : undefined}
          refetch={refetch}
          selected={selected}
          onToggleOne={toggleOne}
          onToggleAll={toggleAll}
          effectivePageIndex={effectivePageIndex}
          effectivePageSize={effectivePageSize}
          filterCount={filterCount}
          onResetFilters={handleResetFilters}
          sortBy={sortBy}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          onOpenMenu={handleOpenMenu}
          menuOpenItemId={menuOpenFor?.item.id}
          onNavigateDetail={(id) => navigate(`/admin/standards/${id}`)}
        />

        <StandardSetPagination
          total={total}
          selectedCount={selected.size}
          onClearSelection={() => setSelected(new Set())}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          canPrev={canPrev}
          canNext={canNext}
          totalPages={totalPages}
          onPageChange={setPageIndex}
        />
      </div>

      <StandardSetActionMenu
        menuOpenFor={menuOpenFor}
        onClose={closeMenu}
        onNavigateDetail={(id) => navigate(`/admin/standards/${id}`)}
        onOpenPublish={handleOpenPublish}
        onOpenEdit={handleOpenEdit}
        onOpenDelete={handleOpenDelete}
        onOpenUnpublish={handleOpenUnpublish}
      />

      <StandardSetFormModal
        isOpen={isFormModalOpen}
        standardSet={editingSet}
        isLoading={isFormLoading}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <AdminConfirmDialog
        isOpen={isPublishModalOpen}
        title="Công bố Bộ tiêu chuẩn"
        description={`Bạn có chắc chắn muốn công bố bộ tiêu chuẩn "${publishingSet?.name || publishingSet?.academicYear}"?\n\nSau khi công bố, bộ tiêu chuẩn này có thể được gắn vào các đợt xét duyệt.`}
        confirmText="Công bố ngay"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={isPublishLoading}
        onConfirm={handlePublishConfirm}
        onClose={() => setIsPublishModalOpen(false)}
      />

      <AdminConfirmDialog
        isOpen={isUnpublishModalOpen}
        title="Hoàn lại về bản nháp"
        description={`Bạn có chắc chắn muốn hoàn lại bộ tiêu chuẩn "${unpublishingSet?.name || unpublishingSet?.academicYear}" về trạng thái Bản nháp (Draft)?\n\nSau khi hoàn lại, bạn có thể tự do chỉnh sửa cây tiêu chí hoặc xóa bỏ bộ tiêu chuẩn này.`}
        confirmText="Hoàn lại về nháp"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={isUnpublishLoading}
        onConfirm={handleUnpublishConfirm}
        onClose={() => setIsUnpublishModalOpen(false)}
      />

      <AdminConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Xóa bộ tiêu chuẩn nháp"
        description={`Bạn có chắc chắn muốn xóa bộ tiêu chuẩn "${deletingSet?.name || deletingSet?.academicYear}"?\n\nToàn bộ các tiêu chí trong bộ tiêu chuẩn này cũng sẽ bị xóa. Thao tác này không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isDeleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
export default StandardSetListPage;
