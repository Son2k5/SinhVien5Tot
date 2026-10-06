import type { IconName } from '../../../components/common/BrandLogo';

export interface CriterionItem {
  number: string;
  title: string;
  description: string;
  icon: IconName;
  tone: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: IconName;
}

export interface GalleryItem {
  src: string;
  alt: string;
  label: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface LandingHeaderProps {
  scrolled: boolean;
  scrollProgress: number;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}
