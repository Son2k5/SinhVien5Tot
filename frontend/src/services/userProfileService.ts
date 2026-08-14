import axios from 'axios';
import type {
  UpdatedUserAvatar,
  UpdateUserProfilePayload,
  UserProfile,
} from '../types/userProfile';
import { apiClient } from './apiClient';
import { sanitizeApiError } from './apiErrorSanitizer';

export const userProfileService = {
  async getMyProfile(): Promise<UserProfile | null> {
    try {
      const response = await apiClient.get<UserProfile>('/users/me/profile');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError<{ code?: string }>(error) &&
          error.response?.status === 404 &&
          error.response.data?.code === 'profile_not_found') {
        return null;
      }
      throw new Error(sanitizeApiError(error));
    }
  },

  async updateMyProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
    try {
      const response = await apiClient.put<UserProfile>('/users/me/profile', payload);
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },

  async updateMyAvatar(file: File): Promise<UpdatedUserAvatar> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiClient.put<UpdatedUserAvatar>(
        '/users/me/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },
};
