import axios from 'axios';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import {
  StaffMeError,
  type StaffAvatarResponse,
  type StaffProfile,
  type UpdateStaffProfilePayload,
} from '../types/staff-me.types';

export const staffMeService = {
  getProfile: async (): Promise<StaffProfile> => {
    try {
      const response = await axiosClient.get<StaffProfile>(ENDPOINTS.STAFF_ME.PROFILE);
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const code = (err.response?.data as { code?: string })?.code;
        throw new StaffMeError(sanitizeApiError(err), status, code);
      }
      throw err;
    }
  },

  updateProfile: async (payload: UpdateStaffProfilePayload): Promise<StaffProfile> => {
    try {
      const response = await axiosClient.put<StaffProfile>(ENDPOINTS.STAFF_ME.PROFILE, payload);
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as { code?: string; detail?: string } | undefined;
        const code = data?.code;
        const message = data?.detail || sanitizeApiError(err);
        throw new StaffMeError(message, status, code);
      }
      throw err;
    }
  },

  uploadAvatar: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<StaffAvatarResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosClient.post<StaffAvatarResponse>(
        ENDPOINTS.STAFF_ME.AVATAR,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && progressEvent.total > 0 && onProgress) {
              const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total));
              onProgress(percent);
            }
          },
        }
      );
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const code = (err.response?.data as { code?: string })?.code;
        throw new StaffMeError(sanitizeApiError(err), status, code);
      }
      throw err;
    }
  },

  removeAvatar: async (): Promise<StaffAvatarResponse> => {
    try {
      const response = await axiosClient.delete<StaffAvatarResponse>(ENDPOINTS.STAFF_ME.AVATAR);
      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const code = (err.response?.data as { code?: string })?.code;
        throw new StaffMeError(sanitizeApiError(err), status, code);
      }
      throw err;
    }
  },
};

export default staffMeService;
