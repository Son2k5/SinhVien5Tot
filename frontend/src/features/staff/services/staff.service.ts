import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  type CreateStaffPayload,
  type CreateStaffResponse,
  type PagedStaffResponse,
  type Staff,
  type StaffFilterParams,
  type UpdateStaffPayload,
  parseStaffApiError,
} from '../types/staff.types';

export const staffService = {
  getStaffList: async (params?: StaffFilterParams): Promise<PagedStaffResponse> => {
    try {
      const response = await axiosClient.get<PagedStaffResponse>(ENDPOINTS.STAFF.BASE, { params });
      return response.data;
    } catch (err: unknown) {
      throw parseStaffApiError(err);
    }
  },

  getStaffById: async (id: string): Promise<Staff> => {
    try {
      const response = await axiosClient.get<Staff>(ENDPOINTS.STAFF.BY_ID(id));
      return response.data;
    } catch (err: unknown) {
      throw parseStaffApiError(err);
    }
  },

  createStaff: async (payload: CreateStaffPayload): Promise<CreateStaffResponse> => {
    try {
      const response = await axiosClient.post<CreateStaffResponse>(ENDPOINTS.STAFF.BASE, payload);
      return response.data;
    } catch (err: unknown) {
      throw parseStaffApiError(err);
    }
  },

  updateStaff: async (id: string, payload: UpdateStaffPayload): Promise<Staff> => {
    try {
      const response = await axiosClient.put<Staff>(ENDPOINTS.STAFF.BY_ID(id), payload);
      return response.data;
    } catch (err: unknown) {
      throw parseStaffApiError(err);
    }
  },

  lockStaff: async (id: string, rowVersion: string): Promise<Staff> => {
    try {
      const response = await axiosClient.post<Staff>(ENDPOINTS.STAFF.LOCK(id), { rowVersion });
      return response.data;
    } catch (err: unknown) {
      throw parseStaffApiError(err);
    }
  },

  unlockStaff: async (id: string, rowVersion: string): Promise<Staff> => {
    try {
      const response = await axiosClient.post<Staff>(ENDPOINTS.STAFF.UNLOCK(id), { rowVersion });
      return response.data;
    } catch (err: unknown) {
      throw parseStaffApiError(err);
    }
  },

  sendInvitation: async (id: string): Promise<void> => {
    try {
      await axiosClient.post<void>(ENDPOINTS.STAFF.SEND_INVITATION(id));
    } catch (err: unknown) {
      throw parseStaffApiError(err);
    }
  },

  deleteStaff: async (id: string, rowVersion: string): Promise<void> => {
    try {
      await axiosClient.delete<void>(ENDPOINTS.STAFF.BY_ID(id), {
        params: { rowVersion },
      });
    } catch (err: unknown) {
      throw parseStaffApiError(err);
    }
  },
};

export default staffService;
