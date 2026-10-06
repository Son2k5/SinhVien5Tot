import {
  landingCriteria,
  landingFaqs,
  landingFeatures,
  landingGallery,
  landingStats,
} from '../components/landingData';
import type {
  CriterionItem,
  FaqItem,
  FeatureItem,
  GalleryItem,
  StatItem,
} from '../types/landing.types';

export const landingService = {
  getStats: (): StatItem[] => landingStats,
  getCriteria: (): CriterionItem[] => landingCriteria,
  getFeatures: (): FeatureItem[] => landingFeatures,
  getGallery: (): GalleryItem[] => landingGallery,
  getFaqs: (): FaqItem[] => landingFaqs,
};

export default landingService;
