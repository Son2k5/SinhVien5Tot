import { useCallback, useMemo, useState } from 'react';
import { SiteFooter as DashboardFooter } from '../components/common/SiteFooter';
import {
  AdminFeedbackSection,
  CriterionDetailsDialog,
  DashboardFallbackNotice,
  DashboardHeader,
  DashboardWelcomeBanner,
  FiveGoodJourneySection,
  HomeDashboardSkeleton,
  MotivationBanner,
  NewsSection,
  SystemFeatureSection,
  SystemLauncher,
  dashboardCriteria,
  formatUserRole,
  mergeDashboardCriteriaWithStandards,
  useLauncher,
  useWelcomeDashboard,
  type CriterionDefinition,
  type CriterionKey,
  type CriterionProgress,
} from '../features/home-dashboard';
import type { User } from '../features/auth/types/auth.types';
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

  const currentCriteria = useMemo(
    () => mergeDashboardCriteriaWithStandards(dashboardCriteria, dashboard.standards),
    [dashboard.standards],
  );

  const criteriaProgress: CriterionProgress[] = useMemo(() => {
    if (dashboard.criteriaProgress && dashboard.criteriaProgress.length > 0) {
      return dashboard.criteriaProgress;
    }
    const defaultKeys: CriterionKey[] = ['ethics', 'study', 'fitness', 'volunteer', 'integration'];
    return defaultKeys.map((key) => ({
      key,
      progress: 0,
      status: 'Chưa bắt đầu',
      completedRequirements: 0,
      totalRequirements: 0,
    }));
  }, [dashboard.criteriaProgress]);

  const activeCriterion = useMemo(() => {
    if (!selectedCriterion) return null;
    return currentCriteria.find((c) => c.key === selectedCriterion.key) ?? selectedCriterion;
  }, [currentCriteria, selectedCriterion]);

  const selectedProgress = activeCriterion
    ? criteriaProgress.find((item) => item.key === activeCriterion.key)
    : undefined;

  return (
    <div className="authenticated-page-background min-h-screen text-slate-700 font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [font-optical-sizing:auto] [-webkit-font-smoothing:antialiased] [text-rendering:optimizeLegibility] selection:bg-blue-100 selection:text-blue-700 flex flex-col">
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
        {isLoading ? (
          <HomeDashboardSkeleton />
        ) : (
          <div className="sv2-content space-y-10 sm:space-y-14">
            {isError && <DashboardFallbackNotice error={error} onRetry={() => void refetch()} />}
            <DashboardWelcomeBanner
              displayName={displayName}
              isRefreshing={isFetching}
              onOpenLauncher={openLauncher}
              onRefresh={() => void refetch()}
            />
            <SystemFeatureSection features={features} onOpenAll={openLauncher} />
            <FiveGoodJourneySection criteria={currentCriteria} progressItems={criteriaProgress} onSelect={setSelectedCriterion} />
            <NewsSection />
            <MotivationBanner />
            <AdminFeedbackSection displayName={displayName} />
          </div>
        )}
      </main>

      <DashboardFooter />

      {activeCriterion && selectedProgress && (
        <CriterionDetailsDialog criterion={activeCriterion} progress={selectedProgress} onClose={closeCriterion} />
      )}
    </div>
  );
}

export default HomePage;
