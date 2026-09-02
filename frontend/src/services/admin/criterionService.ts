import { apiClient } from '../apiClient';
import type {
  CreateCriterionRequest,
  CriterionResponse,
  UpdateCriterionRequest,
} from '../../types/admin/standard';

export const criterionService = {
  async getByStandardId(standardId: string): Promise<CriterionResponse[]> {
    const response = await apiClient.get<CriterionResponse[]>(
      `/admin/standards/${standardId}/criteria`,
    );
    return response.data;
  },

  async create(
    standardId: string,
    data: CreateCriterionRequest,
  ): Promise<CriterionResponse> {
    const response = await apiClient.post<CriterionResponse>(
      `/admin/standards/${standardId}/criteria`,
      data,
    );
    return response.data;
  },

  async update(
    standardId: string,
    criterionId: string,
    data: UpdateCriterionRequest,
  ): Promise<CriterionResponse> {
    const response = await apiClient.put<CriterionResponse>(
      `/admin/standards/${standardId}/criteria/${criterionId}`,
      data,
    );
    return response.data;
  },

  async delete(standardId: string, criterionId: string): Promise<void> {
    await apiClient.delete(
      `/admin/standards/${standardId}/criteria/${criterionId}`,
    );
  },
};
