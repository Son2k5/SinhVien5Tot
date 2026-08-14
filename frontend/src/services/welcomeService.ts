import type { WelcomeDashboard } from '../types/welcome';
import { sanitizeApiError } from './apiErrorSanitizer';
import { apiClient } from './apiClient';

export const welcomeService = {
  async getDashboard(): Promise<WelcomeDashboard> {
    try {
      const response = await apiClient.get<WelcomeDashboard>('/welcome');
      return response.data;
    } catch (error: unknown) {
      throw new Error(sanitizeApiError(error));
    }
  },
};
