import { useEffect, useState } from 'react';
import { useReveal } from './useReveal';

export function useLanding() {
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

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  return {
    mobileOpen,
    scrollProgress,
    scrolled,
    toggleMobile,
    closeMobile,
  };
}

export default useLanding;
