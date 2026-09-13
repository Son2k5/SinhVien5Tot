import { apiClient } from '../apiClient';
import type {
  CreateStandardRequest,
  CreateStandardSetRequest,
  StandardResponse,
  StandardSetResponse,
  UpdateStandardRequest,
  UpdateStandardSetRequest,
} from '../../types/admin/standard';

export const standardService = {
  async getAll(): Promise<StandardSetResponse[]> {
    const response = await apiClient.get<StandardSetResponse[]>('/admin/standard-sets');
    return response.data;
  },

  async getById(id: string): Promise<StandardSetResponse> {
    const response = await apiClient.get<StandardSetResponse>(`/admin/standard-sets/${id}`);
    return response.data;
  },

  async create(data: CreateStandardSetRequest): Promise<StandardSetResponse> {
    const response = await apiClient.post<StandardSetResponse>('/admin/standard-sets', data);
    return response.data;
  },

  async update(id: string, data: UpdateStandardSetRequest): Promise<StandardSetResponse> {
    const response = await apiClient.put<StandardSetResponse>(`/admin/standard-sets/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/standard-sets/${id}`);
  },

  async publish(id: string): Promise<StandardSetResponse> {
    const response = await apiClient.post<StandardSetResponse>(`/admin/standard-sets/${id}/publish`);
    return response.data;
  },

  async unpublish(id: string): Promise<StandardSetResponse> {
    const response = await apiClient.post<StandardSetResponse>(`/admin/standard-sets/${id}/unpublish`);
    return response.data;
  },

  // Standard operations

  async getStandards(standardSetId: string): Promise<StandardResponse[]> {
    const response = await apiClient.get<StandardResponse[]>(
      `/admin/standard-sets/${standardSetId}/standards`,
    );
    return response.data;
  },

  async createStandard(
    standardSetId: string,
    data: CreateStandardRequest,
  ): Promise<StandardResponse> {
    const response = await apiClient.post<StandardResponse>(
      `/admin/standard-sets/${standardSetId}/standards`,
      data,
    );
    return response.data;
  },

  async updateStandard(
    standardSetId: string,
    standardId: string,
    data: UpdateStandardRequest,
  ): Promise<StandardResponse> {
    const response = await apiClient.put<StandardResponse>(
      `/admin/standard-sets/${standardSetId}/standards/${standardId}`,
      data,
    );
    return response.data;
  },

  async deleteStandard(
    standardSetId: string,
    standardId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/admin/standard-sets/${standardSetId}/standards/${standardId}`,
    );
  },

  async initDefaultStandards(standardSetId: string): Promise<StandardResponse[]> {
    const response = await apiClient.post<StandardResponse[]>(
      `/admin/standard-sets/${standardSetId}/standards/init-defaults`,
    );
    return response.data;
  },
};
