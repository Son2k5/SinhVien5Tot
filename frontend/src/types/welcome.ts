export type PortalContentType = 'Notification' | 'News';
export type PortalContentSource = 'System' | 'University' | 'Faculty' | 'YouthUnion';
export type CriterionKey = 'ethics' | 'study' | 'fitness' | 'volunteer' | 'integration';

export interface WelcomeUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  faculty?: string | null;
}

export interface SystemFeature {
  key: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  group: string;
  isAvailable: boolean;
  badge?: string | null;
}

export interface PortalContent {
  id: string;
  type: PortalContentType;
  source: PortalContentSource;
  title: string;
  summary: string;
  route: string;
  icon: string;
  isFeatured: boolean;
  publishedAtUtc: string;
  imageUrl?: string | null;
  category?: string | null;
  eventStartAtUtc?: string | null;
  location?: string | null;
  content?: string[] | null;
}

export interface CriterionProgress {
  key: CriterionKey;
  progress: number;
  status: string;
  completedRequirements: number;
  totalRequirements: number;
  updatedAtUtc?: string | null;
}

export interface YouthGalleryItem {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  capturedAtUtc: string;
  location: string;
}

export interface WelcomeDashboard {
  user: WelcomeUser;
  features: SystemFeature[];
  notifications: PortalContent[];
  news: PortalContent[];
  criteriaProgress?: CriterionProgress[];
  youthGallery?: YouthGalleryItem[];
  updatedAtUtc: string;
}
