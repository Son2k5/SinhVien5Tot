import { apiClient } from '../apiClient';
import type {
  CampaignDetailResponse,
  CampaignFilterParams,
  CampaignResponse,
  CreateCampaignRequest,
  PagedResponse,
  UpdateCampaignRequest,
  UpdateCampaignStatusRequest,
} from '../../types/admin/campaign';

export const campaignService = {
  async getPaged(params: CampaignFilterParams): Promise<PagedResponse<CampaignResponse>> {
    const response = await apiClient.get<PagedResponse<CampaignResponse>>('/admin/campaigns', {
      params,
    });
    return response.data;
  },

  async getAll(params?: Partial<CampaignFilterParams>): Promise<CampaignResponse[]> {
    const response = await apiClient.get<CampaignResponse[]>('/admin/campaigns/all', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<CampaignDetailResponse> {
    const response = await apiClient.get<CampaignDetailResponse>(`/admin/campaigns/${id}`);
    return response.data;
  },

  async create(data: CreateCampaignRequest): Promise<CampaignDetailResponse> {
    const response = await apiClient.post<CampaignDetailResponse>('/admin/campaigns', data);
    return response.data;
  },

  async update(id: string, data: UpdateCampaignRequest): Promise<CampaignDetailResponse> {
    const response = await apiClient.put<CampaignDetailResponse>(`/admin/campaigns/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, request: UpdateCampaignStatusRequest): Promise<CampaignDetailResponse> {
    const response = await apiClient.patch<CampaignDetailResponse>(
      `/admin/campaigns/${id}/status`,
      request,
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/campaigns/${id}`);
  },
};
