import axios from 'axios';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';

export type Gender = 'Male' | 'Female' | 'Other';
export type PoliticalStatus = 'None' | 'UnionMember' | 'PartyMember';
export type AddressType = 'Permanent' | 'Temporary';

export interface UserAddress {
  addressType: AddressType;
  provinceOrCity: string;
  district: string;
  streetAddress: string;
}

export interface UserProfile {
  fullName: string;
  birthDate: string;
  gender: Gender;
  identityCardNumber: string;
  ethnicity: string;
  school: string;
  major?: string | null;
  academicYear: number;
  studentCode: string;
  administrativeClass: string;
  faculty: string;
  currentPosition: string;
  contactEmail: string;
  phoneNumber: string;
  unionPosition?: string | null;
  politicalStatus: PoliticalStatus;
  addresses: UserAddress[];
}

export type UpdateUserProfilePayload = UserProfile;

export interface UpdatedUserAvatar {
  id: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export class UserProfileApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'UserProfileApiError';
    this.status = status;
    this.code = code;
  }
}

export function parseUserProfileApiError(err: unknown): UserProfileApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as { code?: string; detail?: string; message?: string } | undefined;
    const code = data?.code;
    const rawMessage = data?.detail || data?.message;
    const message = rawMessage && typeof rawMessage === 'string' ? rawMessage : sanitizeApiError(err);
    return new UserProfileApiError(message, status, code);
  }
  if (err instanceof UserProfileApiError) return err;
  return new UserProfileApiError(err instanceof Error ? err.message : 'Có lỗi khi thao tác hồ sơ cá nhân.');
}
