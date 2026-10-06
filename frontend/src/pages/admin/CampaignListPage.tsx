import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '../../components/admin/common/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/common/AdminConfirmDialog';
import {
  CampaignFilterBar,
  CampaignTable,
  CampaignPagination,
  CampaignFormModal,
  CampaignStatusModal,
  useCampaignList,
} from '../../features/campaigns';
import { Plus, RefreshCw, Trash2, X } from 'lucide-react';

export function CampaignListPage() {
  const navigate = useNavigate();
  const list = useCampaignList();

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-10">
      {/* Page Header */}
      <AdminPageHeader
        title="Chiến dịch SV5T"
        description="Quản lý thời hạn, bộ tiêu chuẩn và tiến độ các đợt xét duyệt Sinh viên 5 tốt."
        breadcrumbs={[{ label: 'Chiến dịch' }]}
        actions={
          <>
            {list.selected.size > 0 && (
              <button
                type="button"
                onClick={() => list.setIsBatchDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-normal shadow-xs hover:bg-rose-600 hover:text-white hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <Trash2 size={13} strokeWidth={1.8} />
                <span>Xóa đã chọn ({list.selected.size})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void list.refetch()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#d7f0df] text-[#1c7a45] text-xs font-normal shadow-xs hover:bg-[#bfe6cc] hover:text-[#145c34] hover:shadow-sm active:scale-[0.98] transition-[background-color,color,box-shadow] cursor-pointer"
            >
              <RefreshCw size={13} strokeWidth={1.8} className={list.isPending ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={list.handleOpenCreate}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-[#1683ff] text-white text-xs font-medium shadow-xs hover:bg-[#0866db] hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus size={14} strokeWidth={2} />
              <span>Tạo chiến dịch</span>
            </button>
          </>
        }
      />

      {/* Banner */}
      {list.banner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            list.banner.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span>{list.banner.msg}</span>
          <button
            type="button"
            onClick={() => list.setBanner(null)}
            className="p-1 hover:bg-white/60 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Unified card: Filter + Table + Pagination */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
        <CampaignFilterBar
          searchQuery={list.searchQuery}
          onSearchChange={list.setSearchQuery}
          level={list.level}
          onLevelChange={list.setLevel}
          status={list.status}
          onStatusChange={list.setStatus}
          schoolYear={list.schoolYear}
          onSchoolYearChange={list.setSchoolYear}
          activeFilterCount={list.activeFilterCount}
          onReset={list.handleResetFilters}
        />

        <CampaignTable
          items={list.items}
          isPending={list.isPending}
          isError={list.isError}
          refetch={list.refetch}
          selected={list.selected}
          onToggleOne={list.toggleOne}
          onToggleAll={list.toggleAll}
          effectivePageIndex={list.effectivePageIndex}
          effectivePageSize={list.effectivePageSize}
          activeFilterCount={list.activeFilterCount}
          onResetFilters={list.handleResetFilters}
          onOpenView={(id) => navigate(`/admin/campaigns/${id}`)}
          onOpenEdit={list.handleOpenEdit}
          onOpenStatus={list.handleOpenStatus}
          onOpenDelete={list.handleOpenDelete}
        />

        <CampaignPagination
          total={list.total}
          pageSize={list.pageSize}
          onPageSizeChange={list.handlePageSizeChange}
          rangeFrom={list.rangeFrom}
          rangeTo={list.rangeTo}
          canPrev={list.canPrev}
          canNext={list.canNext}
          totalPages={list.totalPages}
          onPageChange={list.setPageIndex}
        />
      </div>

      {/* Create / Edit Modal */}
      <CampaignFormModal
        isOpen={list.isFormModalOpen}
        campaign={list.editingCampaign}
        isLoading={list.isFormLoading}
        onClose={() => list.setIsFormModalOpen(false)}
        onSubmit={list.handleFormSubmit}
      />

      {/* Change Status Modal */}
      <CampaignStatusModal
        isOpen={list.isStatusModalOpen}
        campaign={list.statusCampaign}
        isLoading={list.isStatusLoading}
        onClose={() => list.setIsStatusModalOpen(false)}
        onSave={list.handleStatusSave}
      />

      {/* Delete Confirm Modal */}
      <AdminConfirmDialog
        isOpen={list.isDeleteModalOpen}
        title="Xác nhận xoá chiến dịch"
        description={`Bạn có chắc chắn muốn xoá chiến dịch "${list.deletingCampaign?.name}"?\n\nLưu ý: Chỉ có thể xoá chiến dịch chưa phát sinh hồ sơ đăng ký. Thao tác này không thể hoàn tác.`}
        confirmText="Xác nhận xoá"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={list.isDeleteLoading}
        onConfirm={list.handleDeleteConfirm}
        onClose={() => list.setIsDeleteModalOpen(false)}
      />

      {/* Batch Delete Confirm Modal */}
      <AdminConfirmDialog
        isOpen={list.isBatchDeleteModalOpen}
        title={`Xác nhận xoá ${list.selected.size} chiến dịch`}
        description={`Bạn có chắc chắn muốn xoá ${list.selected.size} chiến dịch đã chọn?\n\nLưu ý: Thao tác này sẽ xoá hoàn toàn các chiến dịch đã chọn khỏi hệ thống (chỉ có thể xoá các chiến dịch chưa phát sinh hồ sơ đăng ký) và không thể khôi phục.`}
        confirmText={`Xoá ${list.selected.size} chiến dịch`}
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={list.isBatchDeleteLoading}
        onConfirm={list.handleBatchDeleteConfirm}
        onClose={() => list.setIsBatchDeleteModalOpen(false)}
      />
    </div>
  );
}
