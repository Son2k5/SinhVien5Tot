/**
 * Generic API response structures
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  detail?: string;
  errors?: Record<string, string[]> | ApiErrorDetail[];
  status?: number;
}
