import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationReviewService } from '../../services/admin/applicationReviewService';
import type {
  ReviewApplicationDecisionRequest,
  ReviewApplicationFilterParams,
  ReviewEvidenceRequest,
} from '../../types/admin/application';

export const APPLICATION_KEYS = {
  all: ['admin-applications'] as const,
  list: (params: ReviewApplicationFilterParams) => ['admin-applications', 'list', params] as const,
  detail: (id: string | null | undefined) => ['admin-applications', 'detail', id] as const,
  evidences: (appId: string | null | undefined) => ['admin-applications', 'evidences', appId] as const,
};

export function useApplicationsPaged(params: ReviewApplicationFilterParams) {
  return useQuery({
    queryKey: APPLICATION_KEYS.list(params),
    queryFn: () => applicationReviewService.getApplications(params),
    refetchInterval: 30000,
  });
}

export function useApplicationDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: APPLICATION_KEYS.detail(id),
    queryFn: () => (id ? applicationReviewService.getApplicationById(id) : null),
    enabled: Boolean(id),
  });
}

export function useApplicationEvidences(applicationId: string | null | undefined) {
  return useQuery({
    queryKey: APPLICATION_KEYS.evidences(applicationId),
    queryFn: () =>
      applicationId
        ? applicationReviewService.getEvidences({ applicationId, pageSize: 100 })
        : null,
    enabled: Boolean(applicationId),
  });
}

export function useEvidenceDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: ['admin-evidence-detail', id],
    queryFn: () => (id ? applicationReviewService.getEvidenceById(id) : null),
    enabled: Boolean(id),
  });
}

export function useEvidencesPaged(params: {
  campaignId?: string;
  status?: string;
  applicationId?: string;
  pageIndex?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['admin-evidences-paged', params],
    queryFn: () => applicationReviewService.getEvidences(params),
  });
}

export function useApplicationReviewMutations() {
  const queryClient = useQueryClient();

  const decideApplication = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: ReviewApplicationDecisionRequest;
    }) => applicationReviewService.decideApplication(id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(APPLICATION_KEYS.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });

  const reviewEvidence = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: ReviewEvidenceRequest;
    }) => applicationReviewService.reviewEvidence(id, body),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({
        queryKey: APPLICATION_KEYS.evidences(updated.applicationId),
      });
      void queryClient.invalidateQueries({
        queryKey: APPLICATION_KEYS.detail(updated.applicationId),
      });
      void queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['admin-evidences-paged'] });
    },
  });

  return {
    decideApplication,
    reviewEvidence,
  };
}
