import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { SystemLauncher } from '../components/dashboard/SystemLauncher';
import {
  CriteriaJourneySection,
  CriteriaProgressSection,
  CriterionDetailsDialog,
  AdminFeedbackSection,
  DashboardFallbackNotice,
  FeaturedActivitiesSection,
  HomeDashboardSkeleton,
  MotivationBanner,
  NewsSection,
  SystemFeatureSection,
  WelcomeHeroSection,
  YouthGallerySection,
  dashboardCriteria,
  formatUserRole,
} from '../components/dashboard/home';
import type { CriterionDefinition } from '../components/dashboard/home';
import { createMockWelcomeDashboard, resolveCriteriaProgress, resolveNewsItems, resolveYouthGallery } from '../mocks/welcomeContent';
import { welcomeService } from '../services/welcomeService';
import type { User } from '../types/auth';
import type { SystemFeature } from '../types/welcome';
import './HomeView.css';
import './HomeViewV2.css';

interface HomeViewProps {
  user: User;
  onLogout: () => void;
}

export function HomeView({ user, onLogout }: HomeViewProps) {
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');
  const [selectedCriterion, setSelectedCriterion] = useState<CriterionDefinition | null>(null);
  const launcherButtonRef = useRef<HTMLButtonElement>(null);
  const launcherSearchRef = useRef<HTMLInputElement>(null);
  const { data, error, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: ['welcome-dashboard', user.id],
    queryFn: welcomeService.getDashboard,
  });
  const dashboard = useMemo(
    () => data ?? createMockWelcomeDashboard(user),
    [data, user],
  );

  useEffect(() => {
    if (!launcherOpen) return;
    const previousOverflow = document.body.style.overflow;
    const triggerButton = launcherButtonRef.current;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => launcherSearchRef.current?.focus());
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setLauncherOpen(false);
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', close);
      triggerButton?.focus();
    };
  }, [launcherOpen]);

  const filteredFeatures = useMemo(() => {
    const query = featureSearch.trim().toLocaleLowerCase('vi');
    if (!query) return dashboard.features;
    return dashboard.features.filter((feature) =>
      (feature.title + ' ' + feature.description + ' ' + feature.group)
        .toLocaleLowerCase('vi')
        .includes(query));
  }, [dashboard.features, featureSearch]);

  const featureGroups = useMemo(
    () => filteredFeatures.reduce<Record<string, SystemFeature[]>>((groups, feature) => {
      (groups[feature.group] ??= []).push(feature);
      return groups;
    }, {}),
    [filteredFeatures],
  );

  const closeCriterion = useCallback(() => setSelectedCriterion(null), []);
  const displayName = dashboard.user.displayName || user.name || user.email.split('@')[0];
  const avatarUrl = dashboard.user.avatarUrl || user.avatarUrl;
  const newsItems = resolveNewsItems(dashboard.news);
  const youthGallery = resolveYouthGallery(dashboard.youthGallery);
  const criteriaProgress = resolveCriteriaProgress(dashboard.criteriaProgress);
  const selectedProgress = selectedCriterion
    ? criteriaProgress.find((item) => item.key === selectedCriterion.key)
    : undefined;

  return (
    <div className='sv-dashboard'>
      <a href='#welcome-content' className='sv2-skip-link'>Chuyển đến nội dung chính</a>

      <DashboardHeader
        displayName={displayName}
        role={formatUserRole(user.role)}
        avatarUrl={avatarUrl}
        notificationCount={dashboard.notifications.length}
        launcherOpen={launcherOpen}
        menuButtonRef={launcherButtonRef}
        onToggleLauncher={() => setLauncherOpen((open) => !open)}
        onOpenLauncher={() => setLauncherOpen(true)}
        onLogout={onLogout}
      />
      <SystemLauncher
        open={launcherOpen}
        searchValue={featureSearch}
        featureGroups={featureGroups}
        filteredCount={filteredFeatures.length}
        searchInputRef={launcherSearchRef}
        onSearchChange={setFeatureSearch}
        onClose={() => setLauncherOpen(false)}
        onLogout={onLogout}
      />

      <main id='welcome-content' tabIndex={-1} className='sv2-main'>
        {isLoading ? <HomeDashboardSkeleton /> : (
          <div className='sv2-content'>
            {isError && <DashboardFallbackNotice error={error} onRetry={() => void refetch()} />}
            <WelcomeHeroSection
              displayName={displayName}
              isRefreshing={isFetching}
              onOpenLauncher={() => setLauncherOpen(true)}
              onRefresh={() => void refetch()}
            />
            <SystemFeatureSection features={dashboard.features} onOpenAll={() => setLauncherOpen(true)} />
            <CriteriaJourneySection criteria={dashboardCriteria} progressItems={criteriaProgress} onSelect={setSelectedCriterion} />
            <CriteriaProgressSection criteria={dashboardCriteria} progressItems={criteriaProgress} onSelect={setSelectedCriterion} />
            <FeaturedActivitiesSection items={newsItems} />
            <NewsSection items={newsItems} />
            <YouthGallerySection items={youthGallery} />
            <MotivationBanner />
            <AdminFeedbackSection displayName={displayName} />
          </div>
        )}
      </main>
      <DashboardFooter />

      {selectedCriterion && selectedProgress && (
        <CriterionDetailsDialog criterion={selectedCriterion} progress={selectedProgress} onClose={closeCriterion} />
      )}
    </div>
  );
}
