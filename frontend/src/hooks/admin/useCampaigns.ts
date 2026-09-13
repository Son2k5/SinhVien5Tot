import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { campaignService } from '../../services/admin/campaignService';
import type {
  CampaignFilterParams,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  UpdateCampaignStatusRequest,
} from '../../types/admin/campaign';

export const campaignQueryKeys = {
  all: ['admin-campaigns'] as const,
  paged: (params: CampaignFilterParams) => ['admin-campaigns', 'paged', params] as const,
  list: (params?: Partial<CampaignFilterParams>) => ['admin-campaigns', 'all', params] as const,
  detail: (id: string) => ['admin-campaigns', 'detail', id] as const,
};

export function useCampaignsPaged(params: CampaignFilterParams) {
  return useQuery({
    queryKey: campaignQueryKeys.paged(params),
    queryFn: () => campaignService.getPaged(params),
    staleTime: 30_000,
  });
}

export function useCampaignsAll(params?: Partial<CampaignFilterParams>) {
  return useQuery({
    queryKey: campaignQueryKeys.list(params),
    queryFn: () => campaignService.getAll(params),
    staleTime: 60_000,
  });
}

export function useCampaignDetail(id: string | undefined) {
  return useQuery({
    queryKey: campaignQueryKeys.detail(id ?? ''),
    queryFn: () => campaignService.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCampaignMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateCampaignRequest) => campaignService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignQueryKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignRequest }) =>
      campaignService.update(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: campaignQueryKeys.all });
      queryClient.setQueryData(campaignQueryKeys.detail(updated.id), updated);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateCampaignStatusRequest }) =>
      campaignService.updateStatus(id, request),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: campaignQueryKeys.all });
      queryClient.setQueryData(campaignQueryKeys.detail(updated.id), updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignQueryKeys.all });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => campaignService.batchDelete(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignQueryKeys.all });
    },
  });

  return {
    createCampaign: createMutation,
    updateCampaign: updateMutation,
    updateCampaignStatus: updateStatusMutation,
    deleteCampaign: deleteMutation,
    batchDeleteCampaigns: batchDeleteMutation,
  };
}
