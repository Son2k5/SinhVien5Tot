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
