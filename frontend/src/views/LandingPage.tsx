import { useEffect, useState } from 'react';
import { SiteFooter } from '../components/common/SiteFooter';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingHeroSection } from '../components/landing/LandingHeroSection';
import { StatsSection } from '../components/landing/StatsSection';
import { AboutSection } from '../components/landing/AboutSection';
import { CriteriaSection } from '../components/landing/CriteriaSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ProcessJourney } from '../components/landing/ProcessJourney';
import { GallerySection } from '../components/landing/GallerySection';
import { WhyChooseSection } from '../components/landing/WhyChooseSection';
import { FeedbackSection } from '../components/landing/FeedbackSection';
import { FaqSection } from '../components/landing/FaqSection';
import { CtaSection } from '../components/landing/CtaSection';
import { feedbackMockData } from '../mocks/feedback';
import { useReveal } from '../hooks/landing/useReveal';

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useReveal();

  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(height > 0 ? (window.scrollY / height) * 100 : 0);
      setScrolled(window.scrollY > 32);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className={`overflow-clip bg-white [--navy:#365d7d] [--muted:#61788f] [--landing-heading:#365d7d] [--landing-body:#536f88] [--landing-muted:#61788f] text-[var(--landing-body)] font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [font-optical-sizing:auto] [-webkit-font-smoothing:antialiased] [text-rendering:optimizeLegibility] [&_button]:font-[inherit] [&_input]:font-[inherit] [&_textarea]:font-[inherit] [&_select]:font-[inherit] [&_.feature-card:first-child_h3]:text-[var(--landing-heading)] [&_.feature-card:first-child_p]:text-[var(--landing-body)]`}>
      <LandingHeader
        scrolled={scrolled}
        scrollProgress={scrollProgress}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main>
        <LandingHeroSection />
        <StatsSection />
        <AboutSection />
        <CriteriaSection />
        <FeaturesSection />
        <ProcessJourney />
        <GallerySection />
        <WhyChooseSection />
        <FeedbackSection feedbackItems={feedbackMockData} />
        <FaqSection />
        <CtaSection />
      </main>

      <SiteFooter />
    </div>
  );
}
