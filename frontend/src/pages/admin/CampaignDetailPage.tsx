import {
  useCampaignDetailView,
  CampaignDetailHeader,
  CampaignKPIs,
  CampaignTimelineCard,
  CampaignInfoTab,
  CampaignCriteriaTab,
  CampaignApplicationsTab,
  CampaignFormModal,
  CampaignStatusModal,
} from '../../features/campaigns';
import { AdminConfirmDialog } from '../../components/admin/common/AdminConfirmDialog';
import { AlertCircle, FileText, FolderTree, Users } from 'lucide-react';

export function CampaignDetailPage() {
  const detail = useCampaignDetailView();

  if (detail.isPending) {
    return (
      <div className="w-[min(1480px,100%)] mx-auto space-y-6 animate-pulse">
        <div className="h-14 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (detail.isError || !detail.campaign) {
    return (
      <div className="w-[min(1480px,100%)] mx-auto p-12 text-center bg-white rounded-[24px_10px_24px_10px] border border-[#dbeaf2] space-y-4">
        <AlertCircle size={40} className="mx-auto text-red-500" />
        <h2 className="text-[20px] font-bold text-[#102340]">Không tìm thấy chiến dịch</h2>
        <p className="text-[13px] text-[#627d8e]">Đợt xét có thể đã bị xóa hoặc đường dẫn không hợp lệ.</p>
        <button
          type="button"
          onClick={detail.navigateToList}
          className="px-4 py-2 text-[13px] font-bold text-white bg-[#177be2] rounded-xl cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const { campaign, standardSet } = detail;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <CampaignDetailHeader
        campaign={campaign}
        onOpenStatusModal={() => detail.setIsStatusModalOpen(true)}
        onOpenEditModal={() => detail.setIsEditModalOpen(true)}
        onOpenDeleteModal={() => detail.setIsDeleteModalOpen(true)}
      />

      {/* KPI Cards */}
      <CampaignKPIs campaign={campaign} stageLabel={detail.stageLabel} />

      {/* Timeline Progress */}
      <CampaignTimelineCard
        campaign={campaign}
        stageLabel={detail.stageLabel}
        progressPercent={detail.progressPercent}
      />

      {/* Tabs */}
      <section className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => detail.setActiveTab('info')}
            className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              detail.activeTab === 'info'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>Thông tin & Quy tắc</span>
          </button>

          <button
            type="button"
            onClick={() => detail.setActiveTab('criteria')}
            className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              detail.activeTab === 'criteria'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FolderTree size={14} />
            <span>Tiêu chuẩn áp dụng</span>
          </button>

          <button
            type="button"
            onClick={() => detail.setActiveTab('applications')}
            className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              detail.activeTab === 'applications'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>Hồ sơ & Thống kê ({campaign.totalApplications})</span>
          </button>
        </div>

        {detail.activeTab === 'info' && <CampaignInfoTab campaign={campaign} />}
        {detail.activeTab === 'criteria' && (
          <CampaignCriteriaTab campaign={campaign} standards={standardSet?.standards} />
        )}
        {detail.activeTab === 'applications' && <CampaignApplicationsTab campaign={campaign} />}
      </section>

      {/* Edit Modal */}
      <CampaignFormModal
        isOpen={detail.isEditModalOpen}
        campaign={campaign}
        isLoading={detail.isEditLoading}
        onClose={() => detail.setIsEditModalOpen(false)}
        onSubmit={detail.handleEditSubmit}
      />

      {/* Status Modal */}
      <CampaignStatusModal
        isOpen={detail.isStatusModalOpen}
        campaign={campaign}
        isLoading={detail.isStatusLoading}
        onClose={() => detail.setIsStatusModalOpen(false)}
        onSave={detail.handleStatusSave}
      />

      {/* Delete Confirm Modal */}
      <AdminConfirmDialog
        isOpen={detail.isDeleteModalOpen}
        title="Xác nhận xoá chiến dịch"
        description={`Bạn có chắc chắn muốn xoá chiến dịch "${campaign.name}"?\n\nThao tác này chỉ thực hiện được khi đợt xét ở trạng thái Nháp và chưa có hồ sơ nào đăng ký.`}
        confirmText="Xác nhận xoá"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={detail.isDeleteLoading}
        onConfirm={detail.handleDeleteConfirm}
        onClose={() => detail.setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
