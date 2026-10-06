import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  type WelcomeDashboard,
  parseHomeDashboardApiError,
} from '../types/home-dashboard.types';

export const homeDashboardService = {
  async getDashboard(): Promise<WelcomeDashboard> {
    try {
      const response = await axiosClient.get<WelcomeDashboard>(ENDPOINTS.WELCOME || '/welcome');
      return response.data;
    } catch (error: unknown) {
      throw parseHomeDashboardApiError(error);
    }
  },
};

export default homeDashboardService;
