import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { standardService } from '../../services/admin/standardService';
import { criterionService } from '../../services/admin/criterionService';
import type {
  CreateCriterionRequest,
  CreateStandardRequest,
  CreateStandardSetRequest,
  UpdateCriterionRequest,
  UpdateStandardRequest,
  UpdateStandardSetRequest,
} from '../../types/admin/standard';

export const standardQueryKeys = {
  all: ['admin-standard-sets'] as const,
  list: () => ['admin-standard-sets', 'list'] as const,
  detail: (id: string) => ['admin-standard-sets', 'detail', id] as const,
  standards: (standardSetId: string) =>
    ['admin-standard-sets', 'standards', standardSetId] as const,
  criteria: (standardId: string) =>
    ['admin-standards', 'criteria', standardId] as const,
};

export function useStandardSets() {
  return useQuery({
    queryKey: standardQueryKeys.list(),
    queryFn: () => standardService.getAll(),
    staleTime: 60_000,
  });
}

export function useStandardSetDetail(id: string | undefined) {
  return useQuery({
    queryKey: standardQueryKeys.detail(id ?? ''),
    queryFn: () => standardService.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useStandardSetMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateStandardSetRequest) => standardService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: standardQueryKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStandardSetRequest }) =>
      standardService.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: standardQueryKeys.all });
      queryClient.setQueryData(standardQueryKeys.detail(updated.id), updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => standardService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: standardQueryKeys.all });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => standardService.publish(id),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: standardQueryKeys.all });
      queryClient.setQueryData(standardQueryKeys.detail(updated.id), updated);
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => standardService.unpublish(id),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: standardQueryKeys.all });
      queryClient.setQueryData(standardQueryKeys.detail(updated.id), updated);
    },
  });

  return {
    createStandardSet: createMutation,
    updateStandardSet: updateMutation,
    deleteStandardSet: deleteMutation,
    publishStandardSet: publishMutation,
    unpublishStandardSet: unpublishMutation,
  };
}

export function useStandardMutations(standardSetId: string) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateStandardRequest) =>
      standardService.createStandard(standardSetId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: standardQueryKeys.detail(standardSetId),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      standardId,
      data,
    }: {
      standardId: string;
      data: UpdateStandardRequest;
    }) => standardService.updateStandard(standardSetId, standardId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: standardQueryKeys.detail(standardSetId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (standardId: string) =>
      standardService.deleteStandard(standardSetId, standardId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: standardQueryKeys.detail(standardSetId),
      });
    },
  });

  const initDefaultsMutation = useMutation({
    mutationFn: () => standardService.initDefaultStandards(standardSetId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: standardQueryKeys.detail(standardSetId),
      });
    },
  });

  return {
    createStandard: createMutation,
    updateStandard: updateMutation,
    deleteStandard: deleteMutation,
    initDefaultStandards: initDefaultsMutation,
  };
}

export function useCriterionMutations(standardSetId: string) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: ({
      standardId,
      data,
    }: {
      standardId: string;
      data: CreateCriterionRequest;
    }) => criterionService.create(standardId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: standardQueryKeys.detail(standardSetId),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      standardId,
      criterionId,
      data,
    }: {
      standardId: string;
      criterionId: string;
      data: UpdateCriterionRequest;
    }) => criterionService.update(standardId, criterionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: standardQueryKeys.detail(standardSetId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      standardId,
      criterionId,
    }: {
      standardId: string;
      criterionId: string;
    }) => criterionService.delete(standardId, criterionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: standardQueryKeys.detail(standardSetId),
      });
    },
  });

  return {
    createCriterion: createMutation,
    updateCriterion: updateMutation,
    deleteCriterion: deleteMutation,
  };
}
