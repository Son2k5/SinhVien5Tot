import axios from 'axios';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';

export type StaffRole = 'Mentor';

export type StaffStatus = 'Active' | 'Locked';

export interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: StaffRole | string;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  rowVersion: string;
}

export interface PagedStaffResponse {
  items: Staff[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateStaffPayload {
  email: string;
  fullName: string;
  phone?: string | null;
  role: StaffRole;
}

export interface CreateStaffResponse {
  staff: Staff;
  invitationSent: boolean;
}

export interface UpdateStaffPayload {
  fullName: string;
  phone?: string | null;
  role: StaffRole;
  rowVersion: string;
}

export interface StaffFilterParams {
  role?: string;
  status?: StaffStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export class StaffApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly isConflict: boolean;
  readonly isForbidden: boolean;
  readonly isNotFound: boolean;
  readonly isValidation: boolean;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'StaffApiError';
    this.status = status;
    this.code = code;
    this.isConflict =
      status === 409 ||
      code === 'concurrency_conflict' ||
      code === 'staff_concurrency_conflict' ||
      code === 'email_taken' ||
      code === 'staff_has_work_history' ||
      code === 'staff_invitation_failed';
    this.isForbidden = status === 403;
    this.isNotFound = status === 404 || code === 'staff_not_found';
    this.isValidation = status === 400 || code === 'staff_inactive';
  }
}

export function parseStaffApiError(err: unknown): StaffApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as { code?: string; detail?: string; message?: string } | undefined;
    const code = data?.code;
    const rawMessage = data?.detail || data?.message;
    const message = rawMessage && typeof rawMessage === 'string' ? rawMessage : sanitizeApiError(err);
    return new StaffApiError(message, status, code);
  }
  if (err instanceof StaffApiError) return err;
  return new StaffApiError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại sau.');
}
