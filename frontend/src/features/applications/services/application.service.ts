import { apiClient } from '../../../api/axiosClient';
import type {
  AdminEvidenceItem,
  PagedResponse,
  ReviewApplicationDecisionRequest,
  ReviewApplicationFilterParams,
  ReviewApplicationItem,
  ReviewEvidenceRequest,
} from '../types/application.types';

export const applicationService = {
  async getApplications(params: ReviewApplicationFilterParams): Promise<PagedResponse<ReviewApplicationItem>> {
    const queryParams: Record<string, unknown> = {
      pageIndex: params.pageIndex ?? 1,
      pageSize: params.pageSize ?? 20,
    };

    if (params.campaignId) queryParams.campaignId = params.campaignId;
    if (params.status) queryParams.status = params.status;

    const res = await apiClient.get<PagedResponse<ReviewApplicationItem>>('/admin/applications', {
      params: queryParams,
    });
    return res.data;
  },

  async getApplicationById(id: string): Promise<ReviewApplicationItem> {
    const res = await apiClient.get<ReviewApplicationItem>(`/admin/applications/${id}`);
    return res.data;
  },

  async decideApplication(
    id: string,
    body: ReviewApplicationDecisionRequest
  ): Promise<ReviewApplicationItem> {
    const res = await apiClient.post<ReviewApplicationItem>(`/admin/applications/${id}/decision`, body);
    return res.data;
  },

  async getEvidences(params: {
    campaignId?: string;
    status?: string;
    applicationId?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Promise<PagedResponse<AdminEvidenceItem>> {
    const queryParams: Record<string, unknown> = {
      pageIndex: params.pageIndex ?? 1,
      pageSize: params.pageSize ?? 100,
    };

    if (params.campaignId) queryParams.campaignId = params.campaignId;
    if (params.status) queryParams.status = params.status;
    if (params.applicationId) queryParams.applicationId = params.applicationId;

    const res = await apiClient.get<PagedResponse<AdminEvidenceItem>>('/admin/evidences', {
      params: queryParams,
    });
    return res.data;
  },

  async getEvidenceById(id: string): Promise<AdminEvidenceItem> {
    const res = await apiClient.get<AdminEvidenceItem>(`/admin/evidences/${id}`);
    return res.data;
  },

  async reviewEvidence(
    id: string,
    body: ReviewEvidenceRequest
  ): Promise<AdminEvidenceItem> {
    const res = await apiClient.post<AdminEvidenceItem>(`/admin/evidences/${id}/review`, body);
    return res.data;
  },
};
