import { AlertCircle, FolderTree, Plus } from 'lucide-react';
import { AdminConfirmDialog } from '../../components/admin/common/AdminConfirmDialog';
import {
  useStandardSetDetailView,
  StandardSetDetailHeader,
  StandardSetChecklistCard,
  CriterionTree,
  StandardGroupModal,
  CriterionItemModal,
} from '../../features/standards';

export function StandardSetDetailPage() {
  const {
    standardSet,
    standards,
    allCriteria,
    isDraft,
    isIndividual,
    groupStatus,
    isPending,
    isError,

    // Modals for Major Standards
    isGroupModalOpen,
    setIsGroupModalOpen,
    editingGroup,
    handleOpenAddGroup,
    handleOpenEditGroup,
    handleGroupFormSubmit,
    isGroupLoading,

    // Modals for Criteria Items
    isCriterionModalOpen,
    setIsCriterionModalOpen,
    editingCriterion,
    targetParentStandard,
    targetRequirementKind,
    handleOpenAddCriterion,
    handleOpenEditCriterion,
    handleCriterionFormSubmit,
    isCriterionLoading,

    // Deletion confirm modals
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deletingStandard,
    deletingCriterion,
    handleOpenDeleteStandard,
    handleOpenDeleteCriterion,
    handleDeleteConfirm,
    isDeleteLoading,

    isPublishModalOpen,
    setIsPublishModalOpen,
    handlePublishConfirm,
    isPublishLoading,

    isUnpublishModalOpen,
    setIsUnpublishModalOpen,
    handleUnpublishConfirm,
    isUnpublishLoading,

    isDeleteSetModalOpen,
    setIsDeleteSetModalOpen,
    handleDeleteSetConfirm,
    isDeleteSetLoading,

    handleQuickInitAllGroups,
    isInitDefaultsLoading,
    navigateToList,
  } = useStandardSetDetailView();

  if (isPending) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-5 animate-pulse">
        <div className="h-14 bg-slate-100 rounded-xl" />
        <div className="h-28 bg-slate-100 rounded-xl" />
        <div className="h-96 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (isError || !standardSet) {
    return (
      <div className="w-full max-w-7xl mx-auto p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
        <AlertCircle size={40} className="mx-auto text-rose-500" />
        <h2 className="text-base font-semibold text-slate-800">Không tìm thấy bộ tiêu chuẩn</h2>
        <button
          type="button"
          onClick={navigateToList}
          className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
      <StandardSetDetailHeader
        standardSet={standardSet}
        isDraft={isDraft}
        isIndividual={isIndividual}
        standardsCount={standards.length}
        groupStatus={groupStatus}
        isUnpublishPending={isUnpublishLoading}
        isInitDefaultsPending={isInitDefaultsLoading}
        onUnpublish={() => setIsUnpublishModalOpen(true)}
        onQuickInit={handleQuickInitAllGroups}
        onAddGroup={handleOpenAddGroup}
        onPublish={() => setIsPublishModalOpen(true)}
        onDeleteSet={() => setIsDeleteSetModalOpen(true)}
      />

      <StandardSetChecklistCard
        standardSet={standardSet}
        standards={standards}
        isIndividual={isIndividual}
        groupStatus={groupStatus}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
              <FolderTree size={17} />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Danh sách Tiêu chuẩn & Tiêu chí xét duyệt
            </h3>
          </div>
          {isDraft && standards.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAddGroup}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus size={14} /> <span>Thêm Tiêu chuẩn lớn</span>
            </button>
          )}
        </div>

        <CriterionTree
          standards={standards}
          isEditable={isDraft}
          onAddGroup={handleOpenAddGroup}
          onQuickInitAllGroups={handleQuickInitAllGroups}
          onEditGroup={handleOpenEditGroup}
          onDeleteGroup={handleOpenDeleteStandard}
          onAddCriterion={handleOpenAddCriterion}
          onEditCriterion={handleOpenEditCriterion}
          onDeleteCriterion={handleOpenDeleteCriterion}
        />
      </section>

      <StandardGroupModal
        isOpen={isGroupModalOpen}
        standardGroup={editingGroup}
        existingGroups={standards}
        isLoading={isGroupLoading}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleGroupFormSubmit}
      />

      <CriterionItemModal
        isOpen={isCriterionModalOpen}
        standardSetId={standardSet.id}
        criterion={editingCriterion}
        parentGroup={targetParentStandard}
        requirementKind={targetRequirementKind}
        existingGroups={standards}
        allCriteria={allCriteria}
        isLoading={isCriterionLoading}
        onClose={() => setIsCriterionModalOpen(false)}
        onSubmit={handleCriterionFormSubmit}
      />

      <AdminConfirmDialog
        isOpen={isDeleteModalOpen}
        title={deletingStandard ? 'Xác nhận xóa Tiêu chuẩn lớn' : 'Xác nhận xóa Tiêu chí'}
        description={
          deletingStandard
            ? `Bạn có chắc chắn muốn xóa Tiêu chuẩn lớn "${deletingStandard.title}"?\n\nCẢNH BÁO: Toàn bộ các tiêu chí con bên trong tiêu chuẩn này cũng sẽ bị xóa đồng thời.`
            : `Bạn có chắc chắn muốn xóa tiêu chí "${deletingCriterion?.criterion.title}" (${deletingCriterion?.criterion.code})?`
        }
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isDeleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      <AdminConfirmDialog
        isOpen={isPublishModalOpen}
        title="Công bố Bộ tiêu chuẩn"
        description="Bạn có chắc chắn muốn công bố (Publish) bộ tiêu chuẩn này?\n\nSau khi công bố, bộ tiêu chuẩn có thể gắn vào các đợt xét."
        confirmText="Xác nhận công bố"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={isPublishLoading}
        onConfirm={handlePublishConfirm}
        onClose={() => setIsPublishModalOpen(false)}
      />

      <AdminConfirmDialog
        isOpen={isUnpublishModalOpen}
        title="Hoàn lại về bản nháp"
        description="Bạn có chắc chắn muốn hoàn lại bộ tiêu chuẩn này về trạng thái Bản nháp (Draft)?\n\nSau khi hoàn lại, bạn có thể chỉnh sửa cấu trúc cây tiêu chí hoặc xóa bộ tiêu chuẩn này."
        confirmText="Hoàn lại về nháp"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={isUnpublishLoading}
        onConfirm={handleUnpublishConfirm}
        onClose={() => setIsUnpublishModalOpen(false)}
      />

      <AdminConfirmDialog
        isOpen={isDeleteSetModalOpen}
        title="Xóa bộ tiêu chuẩn"
        description="Bạn có chắc chắn muốn xóa bộ tiêu chuẩn này?\n\nThao tác chỉ thực hiện được khi ở trạng thái Bản nháp."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isDeleteSetLoading}
        onConfirm={handleDeleteSetConfirm}
        onClose={() => setIsDeleteSetModalOpen(false)}
      />
    </div>
  );
}
export default StandardSetDetailPage;
