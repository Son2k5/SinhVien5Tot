import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AWARD_LEVEL_LABELS,
  AwardType,
  AWARD_TYPE_LABELS,
} from '../../types/admin/campaign';
import {
  StandardGroupCode,
  STANDARD_GROUP_CODE_LABELS,
  StandardSetStatus,
  type CreateCriterionRequest,
  type CreateStandardRequest,
  type CriterionResponse,
  type StandardResponse,
  type UpdateCriterionRequest,
  type UpdateStandardRequest,
} from '../../types/admin/standard';
import {
  useCriterionMutations,
  useStandardMutations,
  useStandardSetDetail,
  useStandardSetMutations,
} from '../../hooks/admin/useStandards';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { CriterionTree } from '../../components/admin/standards/CriterionTree';
import { StandardGroupModal } from '../../components/admin/standards/StandardGroupModal';
import {
  CriterionItemModal,
  type CriterionRequirementKind,
} from '../../components/admin/standards/CriterionItemModal';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  Award,
  Check,
  CheckCircle2,
  CheckSquare,
  FileEdit,
  FolderPlus,
  FolderTree,
  GraduationCap,
  Info,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';

const REQUIRED_INDIVIDUAL_GROUPS = [
  StandardGroupCode.Ethics,
  StandardGroupCode.Study,
  StandardGroupCode.Fitness,
  StandardGroupCode.Volunteer,
  StandardGroupCode.Integration,
];

export function StandardSetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: standardSet, isPending, isError } = useStandardSetDetail(id);
  const {
    createStandard,
    updateStandard,
    deleteStandard,
    initDefaultStandards,
  } = useStandardMutations(id ?? '');

  const {
    createCriterion,
    updateCriterion,
    deleteCriterion,
  } = useCriterionMutations(id ?? '');

  const { publishStandardSet, unpublishStandardSet, deleteStandardSet } = useStandardSetMutations();

  // Modals for Major Standards
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StandardResponse | null>(null);

  // Modals for Criteria Items
  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<CriterionResponse | null>(null);
  const [targetParentStandard, setTargetParentStandard] = useState<StandardResponse | null>(null);
  const [targetRequirementKind, setTargetRequirementKind] = useState<CriterionRequirementKind>('mandatory');

  // Deletion confirm modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingStandard, setDeletingStandard] = useState<StandardResponse | null>(null);
  const [deletingCriterion, setDeletingCriterion] = useState<{ standard: StandardResponse; criterion: CriterionResponse } | null>(null);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [isDeleteSetModalOpen, setIsDeleteSetModalOpen] = useState(false);

  const standards = useMemo(() => standardSet?.standards ?? [], [standardSet?.standards]);
  const isDraft = standardSet?.status === StandardSetStatus.Draft;
  const isIndividual = standardSet?.awardType === AwardType.Individual;

  // Flatten all criteria across standards for lookup
  const allCriteria = useMemo(() => {
    return standards.flatMap((s) => s.criteria ?? []);
  }, [standards]);

  // 5 Group checklist evaluation for Individual standard set
  const groupStatus = useMemo(() => {
    if (!isIndividual) return null;

    const presentCodes = new Set(
      standards.map((s) => s.groupCode).filter(Boolean),
    );

    const checklist = REQUIRED_INDIVIDUAL_GROUPS.map((group) => ({
      code: group,
      label: STANDARD_GROUP_CODE_LABELS[group],
      isComplete: presentCodes.has(group),
    }));

    const completeCount = checklist.filter((item) => item.isComplete).length;
    const isAllReady = completeCount === 5;

    return { checklist, completeCount, isAllReady };
  }, [standards, isIndividual]);

  // 1. Standard (Major standard group) handlers
  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (std: StandardResponse) => {
    setEditingGroup(std);
    setIsGroupModalOpen(true);
  };

  const handleGroupFormSubmit = async (data: CreateStandardRequest | UpdateStandardRequest) => {
    if (editingGroup) {
      await updateStandard.mutateAsync({
        standardId: editingGroup.id,
        data: data as UpdateStandardRequest,
      });
    } else {
      await createStandard.mutateAsync(data as CreateStandardRequest);
    }
  };

  // 2. Quick Initialize All 5 Groups
  const handleQuickInitAllGroups = async () => {
    if (!standardSet || initDefaultStandards.isPending) return;
    await initDefaultStandards.mutateAsync();
  };

  // 3. Criterion handlers
  const handleOpenAddCriterion = (parentStd: StandardResponse, kind: CriterionRequirementKind) => {
    setEditingCriterion(null);
    setTargetParentStandard(parentStd);
    setTargetRequirementKind(kind);
    setIsCriterionModalOpen(true);
  };

  const handleOpenEditCriterion = (parentStd: StandardResponse, item: CriterionResponse) => {
    setEditingCriterion(item);
    setTargetParentStandard(parentStd);
    setIsCriterionModalOpen(true);
  };

  const handleCriterionFormSubmit = async (
    data: CreateCriterionRequest | UpdateCriterionRequest,
    isOptionalSubGroupNeeded?: boolean,
    parentStandardId?: string,
  ) => {
    const activeStandardId = targetParentStandard?.id ?? parentStandardId ?? '';

    if (editingCriterion) {
      await updateCriterion.mutateAsync({
        standardId: activeStandardId,
        criterionId: editingCriterion.id,
        data: data as UpdateCriterionRequest,
      });
      return;
    }

    // Creating new criterion under standard
    if (isOptionalSubGroupNeeded && activeStandardId) {
      const parentStd = standards.find((s) => s.id === activeStandardId);
      const stdCriteria = parentStd?.criteria ?? [];

      let subGroup = stdCriteria.find(
        (c) => c.parentCriterionId === null && c.type === 'Group' as any,
      );

      if (!subGroup) {
        const subGroupResponse = await createCriterion.mutateAsync({
          standardId: activeStandardId,
          data: {
            parentCriterionId: null,
            type: 'Group' as any,
            code: undefined,
            title: 'Nhóm tiêu chí tự chọn (Đạt ít nhất 1 mục)',
            description: 'Danh sách các tiêu chí tự chọn bổ sung.',
            displayOrder: 99,
            operator: 'Any' as any,
            minimumSatisfied: null,
            evaluationType: 'Manual' as any,
            definitionJson: '{}',
            reviewGuidance: null,
          },
        });
        subGroup = subGroupResponse;
      }

      await createCriterion.mutateAsync({
        standardId: activeStandardId,
        data: {
          ...(data as CreateCriterionRequest),
          parentCriterionId: subGroup.id,
        },
      });
    } else {
      await createCriterion.mutateAsync({
        standardId: activeStandardId,
        data: {
          ...(data as CreateCriterionRequest),
          parentCriterionId: null,
        },
      });
    }
  };

  // 4. Delete handlers
  const handleOpenDeleteStandard = (std: StandardResponse) => {
    setDeletingStandard(std);
    setDeletingCriterion(null);
    setIsDeleteModalOpen(true);
  };

  const handleOpenDeleteCriterion = (std: StandardResponse, c: CriterionResponse) => {
    setDeletingCriterion({ standard: std, criterion: c });
    setDeletingStandard(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingStandard) {
      await deleteStandard.mutateAsync(deletingStandard.id);
    } else if (deletingCriterion) {
      await deleteCriterion.mutateAsync({
        standardId: deletingCriterion.standard.id,
        criterionId: deletingCriterion.criterion.id,
      });
    }
    setIsDeleteModalOpen(false);
    setDeletingStandard(null);
    setDeletingCriterion(null);
  };

  const handlePublishConfirm = async () => {
    if (!standardSet) return;
    await publishStandardSet.mutateAsync(standardSet.id);
    setIsPublishModalOpen(false);
  };

  const handleUnpublishConfirm = async () => {
    if (!standardSet) return;
    await unpublishStandardSet.mutateAsync(standardSet.id);
    setIsUnpublishModalOpen(false);
  };

  const handleDeleteSetConfirm = async () => {
    if (!standardSet) return;
    await deleteStandardSet.mutateAsync(standardSet.id);
    navigate('/admin/standards');
  };

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
          onClick={() => navigate('/admin/standards')}
          className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <AdminPageHeader
        title={`Bộ tiêu chuẩn ${standardSet.academicYear}`}
        description={`${AWARD_LEVEL_LABELS[standardSet.level]} · ${AWARD_TYPE_LABELS[standardSet.awardType]}`}
        breadcrumbs={[
          { label: 'Cấu hình tiêu chuẩn', to: '/admin/standards' },
          { label: `Năm học ${standardSet.academicYear}` },
        ]}
        backTo="/admin/standards"
        actions={
          <div className="flex items-center gap-2">
            {standardSet.status === StandardSetStatus.Published && (
              <button
                type="button"
                onClick={() => setIsUnpublishModalOpen(true)}
                disabled={unpublishStandardSet.isPending}
                className="h-9 px-3 rounded-lg font-medium text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={14} />
                <span>Hoàn lại về nháp</span>
              </button>
            )}

            {isDraft && (
              <>
                {standards.length < 5 && isIndividual && (
                  <button
                    type="button"
                    onClick={handleQuickInitAllGroups}
                    disabled={initDefaultStandards.isPending}
                    className="h-9 px-3 rounded-lg font-medium text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Zap size={14} className="text-indigo-600" />
                    <span>Khởi tạo 5 tiêu chuẩn</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenAddGroup}
                  className="h-9 px-3 rounded-lg font-medium text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FolderPlus size={14} />
                  <span>Thêm tiêu chuẩn lớn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(true)}
                  disabled={Boolean(isIndividual && groupStatus && !groupStatus.isAllReady)}
                  className="h-9 px-3.5 rounded-lg font-medium text-xs text-white bg-sky-500 hover:bg-sky-600 active:scale-95 shadow-sm shadow-sky-500/25 inline-flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Upload size={14} className="shrink-0" />
                  <span>Công bố tiêu chuẩn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeleteSetModalOpen(true)}
                  className="h-9 px-3 rounded-lg font-medium text-xs text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  title="Xóa bộ tiêu chuẩn"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Status & 5 Group Completeness Checklist */}
      <section className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-3">
        {/* Card trái: Thông tin tiêu chuẩn */}
        <div className="bg-gradient-to-br from-blue-50/60 via-white to-white rounded-xl border border-blue-100/90 shadow-[0_2px_10px_rgba(37,99,235,0.04)] p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-[13px] font-semibold text-slate-900 tracking-tight">Thông tin tiêu chuẩn</h2>
            </div>
            <div>
              {standardSet.status === StandardSetStatus.Draft && (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  <FileEdit className="w-3 h-3" />
                  Bản nháp
                </span>
              )}
              {standardSet.status === StandardSetStatus.Published && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  Đã công bố
                </span>
              )}
              {standardSet.status === StandardSetStatus.Archived && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  <Archive className="w-3 h-3" />
                  Đã lưu trữ
                </span>
              )}
            </div>
          </div>

          <hr className="border-blue-50 my-2" />

          <dl className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                <GraduationCap className="w-3.5 h-3.5 text-blue-500/80" />
                Cấp độ
              </dt>
              <dd className="text-xs font-medium text-slate-800">{AWARD_LEVEL_LABELS[standardSet.level]}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                <Award className="w-3.5 h-3.5 text-blue-500/80" />
                Danh hiệu
              </dt>
              <dd className="text-xs font-medium text-slate-800">{AWARD_TYPE_LABELS[standardSet.awardType]}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckSquare className="w-3.5 h-3.5 text-blue-500/80" />
                Tiêu chuẩn lớn
              </dt>
              <dd className="text-xs font-medium text-blue-700">
                {standards.length}{isIndividual ? '/5' : ''} tiêu chuẩn
              </dd>
            </div>
          </dl>
        </div>

        {/* Card phải: 5 Tiêu chuẩn */}
        {isIndividual && groupStatus ? (
          <div className="bg-gradient-to-br from-sky-50/40 via-white to-white rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(14,165,233,0.03)] p-3 sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h2 className="text-[13px] font-semibold text-slate-900 tracking-tight">5 Tiêu chuẩn Sinh viên 5 tốt</h2>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                  groupStatus.isAllReady
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {groupStatus.isAllReady ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                Đã có {groupStatus.completeCount}/5 tiêu chuẩn
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {groupStatus.checklist.map((item) => (
                <div
                  key={item.code}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-center transition hover:shadow-xs ${
                    item.isComplete
                      ? 'border-emerald-200/90 bg-emerald-50/90 text-emerald-700 shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      item.isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200/70 text-slate-400'
                    }`}
                  >
                    {item.isComplete ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 stroke-[2]" />
                    )}
                  </div>
                  <span className={`text-xs font-medium leading-tight ${item.isComplete ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)] p-3 sm:p-3.5 flex flex-col justify-center items-center text-center text-slate-500">
            <span className="text-xs">Bộ tiêu chuẩn Tập thể với {standards.length} nhóm tiêu chuẩn đang áp dụng.</span>
          </div>
        )}
      </section>

      {/* Main Standard Groups & Criteria Cards */}
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

      {/* 1. Modal Thêm/Sửa TIÊU CHUẨN LỚN */}
      <StandardGroupModal
        isOpen={isGroupModalOpen}
        standardGroup={editingGroup}
        existingGroups={standards}
        isLoading={createStandard.isPending || updateStandard.isPending}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleGroupFormSubmit}
      />

      {/* 2. Modal Thêm/Sửa TIÊU CHÍ CON */}
      <CriterionItemModal
        isOpen={isCriterionModalOpen}
        standardSetId={standardSet.id}
        criterion={editingCriterion}
        parentGroup={targetParentStandard}
        requirementKind={targetRequirementKind}
        existingGroups={standards}
        allCriteria={allCriteria}
        isLoading={createCriterion.isPending || updateCriterion.isPending}
        onClose={() => setIsCriterionModalOpen(false)}
        onSubmit={handleCriterionFormSubmit}
      />

      {/* Delete Item Confirm Modal */}
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
        isLoading={deleteStandard.isPending || deleteCriterion.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* Publish Standard Set Modal */}
      <AdminConfirmDialog
        isOpen={isPublishModalOpen}
        title="Công bố Bộ tiêu chuẩn"
        description={`Bạn có chắc chắn muốn công bố (Publish) bộ tiêu chuẩn này?\n\nSau khi công bố, bộ tiêu chuẩn có thể gắn vào các đợt xét.`}
        confirmText="Xác nhận công bố"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={publishStandardSet.isPending}
        onConfirm={handlePublishConfirm}
        onClose={() => setIsPublishModalOpen(false)}
      />

      {/* Unpublish Standard Set Modal */}
      <AdminConfirmDialog
        isOpen={isUnpublishModalOpen}
        title="Hoàn lại về bản nháp"
        description={`Bạn có chắc chắn muốn hoàn lại bộ tiêu chuẩn này về trạng thái Bản nháp (Draft)?\n\nSau khi hoàn lại, bạn có thể chỉnh sửa cấu trúc cây tiêu chí hoặc xóa bộ tiêu chuẩn này.`}
        confirmText="Hoàn lại về nháp"
        cancelText="Hủy bỏ"
        variant="warning"
        isLoading={unpublishStandardSet.isPending}
        onConfirm={handleUnpublishConfirm}
        onClose={() => setIsUnpublishModalOpen(false)}
      />

      {/* Delete Set Confirm Modal */}
      <AdminConfirmDialog
        isOpen={isDeleteSetModalOpen}
        title="Xóa bộ tiêu chuẩn"
        description={`Bạn có chắc chắn muốn xóa bộ tiêu chuẩn này?\n\nThao tác chỉ thực hiện được khi ở trạng thái Bản nháp.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteStandardSet.isPending}
        onConfirm={handleDeleteSetConfirm}
        onClose={() => setIsDeleteSetModalOpen(false)}
      />
    </div>
  );
}
