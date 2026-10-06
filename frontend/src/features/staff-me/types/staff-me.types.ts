export interface StaffProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  rowVersion: string;
  position?: string | null;
  staffCode?: string | null;
  lastLoginAt?: string | null;
}

export interface UpdateStaffProfilePayload {
  fullName: string;
  phone?: string | null;
  rowVersion: string;
}

export interface StaffAvatarResponse {
  avatarUrl: string | null;
}

export class StaffMeError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly isConflict: boolean;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'StaffMeError';
    this.status = status;
    this.code = code;
    this.isConflict = status === 409 || code === 'concurrency_conflict';
  }
}
