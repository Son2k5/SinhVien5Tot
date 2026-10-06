import { axiosClient } from '../../../api/axiosClient';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import type {
  CreateCriterionRequest,
  CreateStandardRequest,
  CreateStandardSetRequest,
  CriterionResponse,
  StandardResponse,
  StandardSetResponse,
  UpdateCriterionRequest,
  UpdateStandardRequest,
  UpdateStandardSetRequest,
} from '../types/standard.types';

export const standardService = {
  async getAll(): Promise<StandardSetResponse[]> {
    try {
      const response = await axiosClient.get<StandardSetResponse[]>('/admin/standard-sets');
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async getById(id: string): Promise<StandardSetResponse> {
    try {
      const response = await axiosClient.get<StandardSetResponse>(`/admin/standard-sets/${id}`);
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async create(data: CreateStandardSetRequest): Promise<StandardSetResponse> {
    try {
      const response = await axiosClient.post<StandardSetResponse>('/admin/standard-sets', data);
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async update(id: string, data: UpdateStandardSetRequest): Promise<StandardSetResponse> {
    try {
      const response = await axiosClient.put<StandardSetResponse>(`/admin/standard-sets/${id}`, data);
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await axiosClient.delete(`/admin/standard-sets/${id}`);
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async publish(id: string): Promise<StandardSetResponse> {
    try {
      const response = await axiosClient.post<StandardSetResponse>(`/admin/standard-sets/${id}/publish`);
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async unpublish(id: string): Promise<StandardSetResponse> {
    try {
      const response = await axiosClient.post<StandardSetResponse>(`/admin/standard-sets/${id}/unpublish`);
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  // Standard operations

  async getStandards(standardSetId: string): Promise<StandardResponse[]> {
    try {
      const response = await axiosClient.get<StandardResponse[]>(
        `/admin/standard-sets/${standardSetId}/standards`,
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async createStandard(
    standardSetId: string,
    data: CreateStandardRequest,
  ): Promise<StandardResponse> {
    try {
      const response = await axiosClient.post<StandardResponse>(
        `/admin/standard-sets/${standardSetId}/standards`,
        data,
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async updateStandard(
    standardSetId: string,
    standardId: string,
    data: UpdateStandardRequest,
  ): Promise<StandardResponse> {
    try {
      const response = await axiosClient.put<StandardResponse>(
        `/admin/standard-sets/${standardSetId}/standards/${standardId}`,
        data,
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async deleteStandard(
    standardSetId: string,
    standardId: string,
  ): Promise<void> {
    try {
      await axiosClient.delete(
        `/admin/standard-sets/${standardSetId}/standards/${standardId}`,
      );
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async initDefaultStandards(standardSetId: string): Promise<StandardResponse[]> {
    try {
      const response = await axiosClient.post<StandardResponse[]>(
        `/admin/standard-sets/${standardSetId}/standards/init-defaults`,
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },
};

export const criterionService = {
  async getByStandardId(standardId: string): Promise<CriterionResponse[]> {
    try {
      const response = await axiosClient.get<CriterionResponse[]>(
        `/admin/standards/${standardId}/criteria`,
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async create(
    standardId: string,
    data: CreateCriterionRequest,
  ): Promise<CriterionResponse> {
    try {
      const response = await axiosClient.post<CriterionResponse>(
        `/admin/standards/${standardId}/criteria`,
        data,
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async update(
    standardId: string,
    criterionId: string,
    data: UpdateCriterionRequest,
  ): Promise<CriterionResponse> {
    try {
      const response = await axiosClient.put<CriterionResponse>(
        `/admin/standards/${standardId}/criteria/${criterionId}`,
        data,
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async delete(standardId: string, criterionId: string): Promise<void> {
    try {
      await axiosClient.delete(
        `/admin/standards/${standardId}/criteria/${criterionId}`,
      );
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },
};
