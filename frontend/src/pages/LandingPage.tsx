import { SiteFooter } from '../components/common/SiteFooter';
import { feedbackMockData } from '../mocks/feedback';
import {
  AboutSection,
  CriteriaSection,
  CtaSection,
  FaqSection,
  FeaturesSection,
  FeedbackSection,
  LandingHeader,
  LandingHeroSection,
  ProcessJourney,
  StatsSection,
  WhyChooseSection,
  useLanding,
} from '../features/landing';

export function LandingPage() {
  const { mobileOpen, scrollProgress, scrolled, toggleMobile, closeMobile } = useLanding();

  return (
    <div className={`overflow-clip bg-white [--navy:#365d7d] [--muted:#61788f] [--landing-heading:#365d7d] [--landing-body:#536f88] [--landing-muted:#61788f] text-[var(--landing-body)] font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [font-optical-sizing:auto] [-webkit-font-smoothing:antialiased] [text-rendering:optimizeLegibility] [&_button]:font-[inherit] [&_input]:font-[inherit] [&_textarea]:font-[inherit] [&_select]:font-[inherit] [&_.feature-card:first-child_h3]:text-[var(--landing-heading)] [&_.feature-card:first-child_p]:text-[var(--landing-body)]`}>
      <LandingHeader
        scrolled={scrolled}
        scrollProgress={scrollProgress}
        mobileOpen={mobileOpen}
        onToggleMobile={toggleMobile}
        onCloseMobile={closeMobile}
      />

      <main>
        <LandingHeroSection />
        <StatsSection />
        <AboutSection />
        <CriteriaSection />
        <FeaturesSection />
        <ProcessJourney />
        <WhyChooseSection />
        <FeedbackSection feedbackItems={feedbackMockData} />
        <FaqSection />
        <CtaSection />
      </main>

      <SiteFooter />
    </div>
  );
}

export default LandingPage;
