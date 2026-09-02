import { useCallback, useState } from 'react';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { SystemLauncher } from '../components/dashboard/SystemLauncher';
import {
  FiveGoodJourneySection,
  CriterionDetailsDialog,
  AdminFeedbackSection,
  DashboardFallbackNotice,
  FeaturedActivitiesSection,
  HomeDashboardSkeleton,
  MotivationBanner,
  NewsSection,
  SystemFeatureSection,
  DashboardWelcomeBanner,
  YouthGallerySection,
  dashboardCriteria,
  formatUserRole,
} from '../components/dashboard/home';
import type { CriterionDefinition } from '../components/dashboard/home';
import { resolveCriteriaProgress, resolveNewsItems, resolveYouthGallery } from '../mocks/welcomeContent';
import { useWelcomeDashboard } from '../hooks/dashboard/useWelcomeDashboard';
import { useLauncher } from '../hooks/dashboard/useLauncher';
import type { User } from '../types/auth';
import './HomePage.css';

interface HomePageProps {
  user: User;
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<CriterionDefinition | null>(null);

  const {
    dashboard,
    displayName,
    avatarUrl,
    notifications,
    features,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useWelcomeDashboard(user);

  const {
    launcherOpen,
    featureSearch,
    filteredFeatures,
    featureGroups,
    launcherButtonRef,
    launcherSearchRef,
    openLauncher,
    closeLauncher,
    toggleLauncher,
    setFeatureSearch,
  } = useLauncher(features, true);

  const closeCriterion = useCallback(() => setSelectedCriterion(null), []);
  const newsItems = resolveNewsItems(dashboard.news);
  const youthGallery = resolveYouthGallery(dashboard.youthGallery);
  const criteriaProgress = resolveCriteriaProgress(dashboard.criteriaProgress);
  const selectedProgress = selectedCriterion
    ? criteriaProgress.find((item) => item.key === selectedCriterion.key)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-700 font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [font-optical-sizing:auto] [-webkit-font-smoothing:antialiased] [text-rendering:optimizeLegibility] selection:bg-blue-100 selection:text-blue-700 flex flex-col">
      <a 
        href="#welcome-content" 
        className="fixed z-[300] top-3 left-3 px-4 py-2 text-sm font-medium text-blue-600 border border-slate-200 rounded-lg bg-white shadow-md transition-transform duration-200 -translate-y-40 focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Chuyển đến nội dung chính
      </a>

      <DashboardHeader
        displayName={displayName}
        role={formatUserRole(user.role)}
        avatarUrl={avatarUrl}
        notificationCount={notifications.length}
        launcherOpen={launcherOpen}
        menuButtonRef={launcherButtonRef}
        onToggleLauncher={toggleLauncher}
        onOpenLauncher={openLauncher}
        onLogout={onLogout}
      />

      <SystemLauncher
        open={launcherOpen}
        searchValue={featureSearch}
        featureGroups={featureGroups}
        filteredCount={filteredFeatures.length}
        searchInputRef={launcherSearchRef}
        onSearchChange={setFeatureSearch}
        onClose={closeLauncher}
        onLogout={onLogout}
      />

      <main id="welcome-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 outline-none">
        {isLoading ? <HomeDashboardSkeleton /> : (
          <div className="sv2-content space-y-10 sm:space-y-14">
            {isError && <DashboardFallbackNotice error={error} onRetry={() => void refetch()} />}
            <DashboardWelcomeBanner
              displayName={displayName}
              isRefreshing={isFetching}
              onOpenLauncher={openLauncher}
              onRefresh={() => void refetch()}
            />
            <SystemFeatureSection features={dashboard.features} onOpenAll={openLauncher} />
            <FiveGoodJourneySection criteria={dashboardCriteria} progressItems={criteriaProgress} onSelect={setSelectedCriterion} />
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
