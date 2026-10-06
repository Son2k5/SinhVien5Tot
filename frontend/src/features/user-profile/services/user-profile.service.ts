import axios from 'axios';
import { axiosClient } from '../../../api/axiosClient';
import {
  type UpdatedUserAvatar,
  type UpdateUserProfilePayload,
  type UserProfile,
  parseUserProfileApiError,
} from '../types/user-profile.types';

export const userProfileService = {
  async getMyProfile(): Promise<UserProfile | null> {
    try {
      const response = await axiosClient.get<UserProfile>('/users/me/profile');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw parseUserProfileApiError(error);
    }
  },

  async updateMyProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
    try {
      const response = await axiosClient.put<UserProfile>('/users/me/profile', payload);
      return response.data;
    } catch (error: unknown) {
      throw parseUserProfileApiError(error);
    }
  },

  async updateMyAvatar(file: File): Promise<UpdatedUserAvatar> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await axiosClient.put<UpdatedUserAvatar>(
        '/users/me/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    } catch (error: unknown) {
      throw parseUserProfileApiError(error);
    }
  },
};

export default userProfileService;
