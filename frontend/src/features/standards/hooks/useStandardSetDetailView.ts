import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AwardType,
} from '../../campaigns/types/campaign.types';
import {
  CriterionEvaluationType,
  CriterionOperator,
  CriterionType,
  StandardGroupCode,
  STANDARD_GROUP_CODE_LABELS,
  StandardSetStatus,
  type CreateCriterionRequest,
  type CreateStandardRequest,
  type CriterionResponse,
  type StandardResponse,
  type UpdateCriterionRequest,
  type UpdateStandardRequest,
} from '../types/standard.types';
import {
  useCriterionMutations,
  useStandardMutations,
  useStandardSetDetail,
  useStandardSetMutations,
} from './useStandards';
import type { CriterionRequirementKind } from '../components/CriterionItemModal';

const REQUIRED_INDIVIDUAL_GROUPS = [
  StandardGroupCode.Ethics,
  StandardGroupCode.Study,
  StandardGroupCode.Fitness,
  StandardGroupCode.Volunteer,
  StandardGroupCode.Integration,
];

export function useStandardSetDetailView() {
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
      standards.flatMap((s) => (s.groupCode ? [s.groupCode] : [])),
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
        (c) => c.parentCriterionId === null && c.type === CriterionType.Group,
      );

      if (!subGroup) {
        const subGroupResponse = await createCriterion.mutateAsync({
          standardId: activeStandardId,
          data: {
            parentCriterionId: null,
            type: CriterionType.Group,
            code: undefined,
            title: 'Nhóm tiêu chí tự chọn (Đạt ít nhất 1 mục)',
            description: 'Danh sách các tiêu chí tự chọn bổ sung.',
            displayOrder: 99,
            operator: CriterionOperator.Any,
            minimumSatisfied: null,
            evaluationType: CriterionEvaluationType.Manual,
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
    if (!id) return;
    await publishStandardSet.mutateAsync(id);
    setIsPublishModalOpen(false);
  };

  const handleUnpublishConfirm = async () => {
    if (!id) return;
    await unpublishStandardSet.mutateAsync(id);
    setIsUnpublishModalOpen(false);
  };

  const handleDeleteSetConfirm = async () => {
    if (!id) return;
    await deleteStandardSet.mutateAsync(id);
    setIsDeleteSetModalOpen(false);
    navigate('/admin/standards');
  };

  return {
    id,
    standardSet,
    standards,
    allCriteria,
    isDraft,
    isIndividual,
    groupStatus,
    isPending,
    isError,

    // Modals
    isGroupModalOpen,
    setIsGroupModalOpen,
    editingGroup,
    handleOpenAddGroup,
    handleOpenEditGroup,
    handleGroupFormSubmit,
    isGroupLoading: createStandard.isPending || updateStandard.isPending,

    isCriterionModalOpen,
    setIsCriterionModalOpen,
    editingCriterion,
    targetParentStandard,
    targetRequirementKind,
    handleOpenAddCriterion,
    handleOpenEditCriterion,
    handleCriterionFormSubmit,
    isCriterionLoading: createCriterion.isPending || updateCriterion.isPending,

    isDeleteModalOpen,
    setIsDeleteModalOpen,
    deletingStandard,
    deletingCriterion,
    handleOpenDeleteStandard,
    handleOpenDeleteCriterion,
    handleDeleteConfirm,
    isDeleteLoading: deleteStandard.isPending || deleteCriterion.isPending,

    isPublishModalOpen,
    setIsPublishModalOpen,
    handlePublishConfirm,
    isPublishLoading: publishStandardSet.isPending,

    isUnpublishModalOpen,
    setIsUnpublishModalOpen,
    handleUnpublishConfirm,
    isUnpublishLoading: unpublishStandardSet.isPending,

    isDeleteSetModalOpen,
    setIsDeleteSetModalOpen,
    handleDeleteSetConfirm,
    isDeleteSetLoading: deleteStandardSet.isPending,

    handleQuickInitAllGroups,
    isInitDefaultsLoading: initDefaultStandards.isPending,
    navigateToList: () => navigate('/admin/standards'),
  };
}
