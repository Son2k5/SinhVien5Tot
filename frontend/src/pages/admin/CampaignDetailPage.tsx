import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useCampaignDetail,
  useCampaignMutations,
} from '../../hooks/admin/useCampaigns';
import { useStandardSetDetail } from '../../hooks/admin/useStandards';
import {
  AwardLevelBadge,
  AwardTypeBadge,
  CampaignStatusBadge,
} from '../../components/admin/AdminStatusBadge';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { CampaignFormModal } from '../../components/admin/CampaignFormModal';
import { CampaignStatusModal } from '../../components/admin/CampaignStatusModal';
import { CriterionTree } from '../../components/admin/CriterionTree';
import {
  AwardType,
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
  CampaignStatus,
  type UpdateCampaignRequest,
} from '../../types/admin/campaign';

import {
  AlertCircle,
  ArrowRight,
  Clock,
  Code2,
  Edit2,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderTree,
  Trash2,
  Users,
} from 'lucide-react';

function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: campaign, isPending, isError } = useCampaignDetail(id);
  const { data: standardSet } = useStandardSetDetail(campaign?.standardSetId);


  const {
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
  } = useCampaignMutations();

  const [activeTab, setActiveTab] = useState<'info' | 'criteria' | 'applications'>('info');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (isPending) {
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

  if (isError || !campaign) {
    return (
      <div className="w-[min(1480px,100%)] mx-auto p-12 text-center bg-white rounded-[24px_10px_24px_10px] border border-[#dbeaf2] space-y-4">
        <AlertCircle size={40} className="mx-auto text-red-500" />
        <h2 className="text-[20px] font-bold text-[#102340]">Không tìm thấy chiến dịch</h2>
        <p className="text-[13px] text-[#627d8e]">Đợt xét có thể đã bị xóa hoặc đường dẫn không hợp lệ.</p>
        <button
          type="button"
          onClick={() => navigate('/admin/campaigns')}
          className="px-4 py-2 text-[13px] font-bold text-white bg-[#177be2] rounded-xl cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isDraft = campaign.status === CampaignStatus.Draft;
  const isClosedOrArchived =
    campaign.status === CampaignStatus.Closed ||
    campaign.status === CampaignStatus.Archived;

  const now = Date.now();
  const tOpen = new Date(campaign.regOpenAt).getTime();
  const tClose = new Date(campaign.regCloseAt).getTime();
  const tSubmit = new Date(campaign.submitDeadline).getTime();
  const tReview = new Date(campaign.reviewDeadline).getTime();

  // Timeline stage
  let stageLabel = 'Chưa bắt đầu';
  let progressPercent = 0;

  if (now < tOpen) {
    stageLabel = 'Chưa mở cổng đăng ký';
    progressPercent = 5;
  } else if (now >= tOpen && now <= tClose) {
    stageLabel = 'Đang trong thời gian mở đăng ký';
    progressPercent = 35;
  } else if (now > tClose && now <= tSubmit) {
    stageLabel = 'Đang tiếp nhận hoàn thiện minh chứng';
    progressPercent = 65;
  } else if (now > tSubmit && now <= tReview) {
    stageLabel = 'Đang tiến hành xét duyệt hồ sơ';
    progressPercent = 85;
  } else {
    stageLabel = 'Đã hoàn thành toàn bộ các mốc thời hạn';
    progressPercent = 100;
  }

  const handleEditSubmit = async (formData: unknown) => {
    await updateCampaign.mutateAsync({
      id: campaign.id,
      data: formData as UpdateCampaignRequest,
    });
  };

  const handleStatusSave = async (newStatus: CampaignStatus) => {
    await updateCampaignStatus.mutateAsync({
      id: campaign.id,
      request: { status: newStatus },
    });
  };

  const handleDeleteConfirm = async () => {
    await deleteCampaign.mutateAsync(campaign.id);
    navigate('/admin/campaigns');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <AdminPageHeader
        title={campaign.name}
        description={`Năm học ${campaign.schoolYear} · ${AWARD_LEVEL_LABELS[campaign.level]} · ${AWARD_TYPE_LABELS[campaign.awardType]}`}
        breadcrumbs={[
          { label: 'Chiến dịch', to: '/admin/campaigns' },
          { label: campaign.name },
        ]}
        backTo="/admin/campaigns"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(true)}
              className="h-9 px-3.5 rounded-lg font-medium text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Đổi trạng thái</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isClosedOrArchived}
              className="h-9 px-3.5 rounded-lg font-medium text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Edit2 size={14} />
              <span>Chỉnh sửa</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={!isDraft || campaign.totalApplications > 0}
              className="h-9 px-3 rounded-lg font-medium text-xs text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                !isDraft
                  ? 'Chỉ có thể xoá chiến dịch ở trạng thái Nháp'
                  : campaign.totalApplications > 0
                  ? 'Không thể xoá chiến dịch đã có hồ sơ'
                  : 'Xoá chiến dịch nháp'
              }
            >
              <Trash2 size={14} />
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <span className="text-xs font-medium text-slate-500">
            Trạng thái hiện tại
          </span>
          <div className="pt-0.5">
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stageLabel}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Tổng hồ sơ đăng ký
          </span>
          <div className="text-2xl font-semibold text-slate-800 leading-tight pt-0.5">
            {campaign.totalApplications.toLocaleString('vi-VN')}
          </div>
          <Link
            to={`/admin/applications?campaignId=${campaign.id}`}
            className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1 pt-0.5"
          >
            <span>Quản lý hồ sơ</span> <ArrowRight size={12} />
          </Link>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Cấp & Danh hiệu
          </span>
          <div className="flex items-center gap-1.5 pt-0.5">
            <AwardLevelBadge level={campaign.level} />
            <AwardTypeBadge awardType={campaign.awardType} />
          </div>
          <p className="text-xs text-slate-500 mt-1">Năm học {campaign.schoolYear}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Bộ tiêu chuẩn áp dụng
          </span>
          <div className="font-medium text-xs text-slate-800 line-clamp-1 pt-0.5">
            {campaign.standardSetName ?? `Bộ tiêu chuẩn ID: ${campaign.standardSetId.slice(0, 8)}`}
          </div>
          <Link
            to={`/admin/standards/${campaign.standardSetId}`}
            className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1 pt-0.5"
          >
            <span>Xem cây tiêu chí</span> <ExternalLink size={12} />
          </Link>
        </div>
      </section>

      {/* Visual Timeline Progress */}
      <section className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Clock size={15} className="text-blue-600" />
            <span>Tiến độ mốc thời hạn</span>
          </div>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
            {stageLabel}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 4 Milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
            <span className="text-[11px] font-medium text-blue-600">1. Mở đăng ký</span>
            <div className="text-xs font-medium text-slate-800">{formatDateTime(campaign.regOpenAt)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
            <span className="text-[11px] font-medium text-blue-600">2. Đóng đăng ký</span>
            <div className="text-xs font-medium text-slate-800">{formatDateTime(campaign.regCloseAt)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
            <span className="text-[11px] font-medium text-blue-600">3. Hạn nộp minh chứng</span>
            <div className="text-xs font-medium text-slate-800">{formatDateTime(campaign.submitDeadline)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
            <span className="text-[11px] font-medium text-blue-600">4. Hạn duyệt hồ sơ</span>
            <div className="text-xs font-medium text-slate-800">{formatDateTime(campaign.reviewDeadline)}</div>
          </div>
        </div>
      </section>

      {/* Tabs Layout */}
      <section className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>Thông tin & Quy tắc</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              activeTab === 'criteria'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FolderTree size={14} />
            <span>Tiêu chuẩn áp dụng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>Hồ sơ & Thống kê ({campaign.totalApplications})</span>
          </button>
        </div>

        {/* TAB 1: THÔNG TIN & QUY TẮC */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-800">Mô tả đợt xét</h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200 whitespace-pre-line">
                  {campaign.description || 'Chưa có mô tả chi tiết cho đợt xét này.'}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-800">Cấu hình tiên quyết & Phân cấp</h3>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Cấp xét duyệt:</span>
                    <span className="text-slate-800 font-medium">{AWARD_LEVEL_LABELS[campaign.level]}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Loại danh hiệu:</span>
                    <span className="text-slate-800 font-medium">{AWARD_TYPE_LABELS[campaign.awardType]}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Đợt xét tiên quyết:</span>
                    <span className="text-slate-800 font-medium">
                      {campaign.prerequisiteCampaignName ?? 'Không yêu cầu (Cấp cơ sở)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {campaign.awardType === AwardType.Collective && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code2 size={15} className="text-blue-600" />
                  <h3 className="text-xs font-semibold text-slate-800">Quy tắc xét chuẩn tập thể (JSON)</h3>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 text-sky-300 font-mono text-xs overflow-x-auto">
                  {campaign.collectiveEligibilityRuleJson}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TIÊU CHUẨN & TIÊU CHÍ */}
        {activeTab === 'criteria' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-xl border border-blue-100">
              <div className="text-xs text-blue-900">
                Bộ tiêu chuẩn áp dụng:{' '}
                <span className="font-medium">{campaign.standardSetName ?? campaign.standardSetId}</span>
              </div>
              <Link
                to={`/admin/standards/${campaign.standardSetId}`}
                className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Xem cấu hình chuẩn</span> <ExternalLink size={12} />
              </Link>
            </div>

            {standardSet?.standards ? (
              <CriterionTree standards={standardSet.standards} isEditable={false} />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải cây tiêu chí...</div>
            )}
          </div>
        )}

        {/* TAB 3: HỒ SƠ & THỐNG KÊ */}
        {activeTab === 'applications' && (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileCheck2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800">
                {campaign.totalApplications} hồ sơ đã tiếp nhận
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Chuyển sang module Hồ sơ đăng ký để lọc, phân loại theo trạng thái và thẩm định chi tiết từng minh chứng.
              </p>
            </div>
            <Link
              to={`/admin/applications?campaignId=${campaign.id}`}
              className="px-4 py-2 rounded-lg font-medium text-xs text-white bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Xem danh sách hồ sơ</span> <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* Edit Campaign Modal */}
      <CampaignFormModal
        isOpen={isEditModalOpen}
        campaign={campaign}
        isLoading={updateCampaign.isPending}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {/* Status Modal */}
      <CampaignStatusModal
        isOpen={isStatusModalOpen}
        campaign={campaign}
        isLoading={updateCampaignStatus.isPending}
        onClose={() => setIsStatusModalOpen(false)}
        onSave={handleStatusSave}
      />

      {/* Delete Confirm Modal */}
      <AdminConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Xác nhận xoá chiến dịch"
        description={`Bạn có chắc chắn muốn xoá chiến dịch "${campaign.name}"?\n\nThao tác này chỉ thực hiện được khi đợt xét ở trạng thái Nháp và chưa có hồ sơ nào đăng ký.`}
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
