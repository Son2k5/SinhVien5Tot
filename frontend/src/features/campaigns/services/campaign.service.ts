import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  type CampaignDetailResponse,
  type CampaignFilterParams,
  type CampaignResponse,
  type CreateCampaignRequest,
  type PagedResponse,
  type UpdateCampaignRequest,
  type UpdateCampaignStatusRequest,
  parseCampaignApiError,
} from '../types/campaign.types';

export const campaignService = {
  async getPaged(params: CampaignFilterParams): Promise<PagedResponse<CampaignResponse>> {
    try {
      const response = await axiosClient.get<PagedResponse<CampaignResponse>>(
        ENDPOINTS.ADMIN?.CAMPAIGNS?.BASE || '/admin/campaigns',
        { params },
      );
      return response.data;
    } catch (error: unknown) {
      throw parseCampaignApiError(error);
    }
  },

  async getAll(params?: Partial<CampaignFilterParams>): Promise<CampaignResponse[]> {
    try {
      const response = await axiosClient.get<CampaignResponse[]>('/admin/campaigns/all', {
        params,
      });
      return response.data;
    } catch (error: unknown) {
      throw parseCampaignApiError(error);
    }
  },

  async getById(id: string): Promise<CampaignDetailResponse> {
    try {
      const endpoint = ENDPOINTS.ADMIN?.CAMPAIGNS?.BY_ID
        ? ENDPOINTS.ADMIN.CAMPAIGNS.BY_ID(id)
        : `/admin/campaigns/${id}`;
      const response = await axiosClient.get<CampaignDetailResponse>(endpoint);
      return response.data;
    } catch (error: unknown) {
      throw parseCampaignApiError(error);
    }
  },

  async create(data: CreateCampaignRequest): Promise<CampaignDetailResponse> {
    try {
      const response = await axiosClient.post<CampaignDetailResponse>(
        ENDPOINTS.ADMIN?.CAMPAIGNS?.BASE || '/admin/campaigns',
        data,
      );
      return response.data;
    } catch (error: unknown) {
      throw parseCampaignApiError(error);
    }
  },

  async update(id: string, data: UpdateCampaignRequest): Promise<CampaignDetailResponse> {
    try {
      const endpoint = ENDPOINTS.ADMIN?.CAMPAIGNS?.BY_ID
        ? ENDPOINTS.ADMIN.CAMPAIGNS.BY_ID(id)
        : `/admin/campaigns/${id}`;
      const response = await axiosClient.put<CampaignDetailResponse>(endpoint, data);
      return response.data;
    } catch (error: unknown) {
      throw parseCampaignApiError(error);
    }
  },

  async updateStatus(
    id: string,
    request: UpdateCampaignStatusRequest,
  ): Promise<CampaignDetailResponse> {
    try {
      const endpoint = ENDPOINTS.ADMIN?.CAMPAIGNS?.STATUS
        ? ENDPOINTS.ADMIN.CAMPAIGNS.STATUS(id)
        : `/admin/campaigns/${id}/status`;
      const response = await axiosClient.patch<CampaignDetailResponse>(endpoint, request);
      return response.data;
    } catch (error: unknown) {
      throw parseCampaignApiError(error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const endpoint = ENDPOINTS.ADMIN?.CAMPAIGNS?.BY_ID
        ? ENDPOINTS.ADMIN.CAMPAIGNS.BY_ID(id)
        : `/admin/campaigns/${id}`;
      await axiosClient.delete(endpoint);
    } catch (error: unknown) {
      throw parseCampaignApiError(error);
    }
  },

  async batchDelete(ids: string[]): Promise<{ deletedCount: number }> {
    try {
      const response = await axiosClient.post<{ deletedCount: number }>(
        '/admin/campaigns/batch-delete',
        { ids },
      );
      return response.data;
    } catch (error: unknown) {
      throw parseCampaignApiError(error);
    }
  },
};

export default campaignService;
