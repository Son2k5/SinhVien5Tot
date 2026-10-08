import axios from 'axios';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  type UpdatedUserAvatar,
  type UpdateUserProfilePayload,
  type UserProfile,
  parseUserProfileApiError,
} from '../types/user-profile.types';

export const userProfileService = {
  async getMyProfile(): Promise<UserProfile | null> {
    try {
      const response = await axiosClient.get<UserProfile>(ENDPOINTS.USERS.PROFILE);
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
      const response = await axiosClient.put<UserProfile>(ENDPOINTS.USERS.PROFILE, payload);
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
        ENDPOINTS.USERS.AVATAR,
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
