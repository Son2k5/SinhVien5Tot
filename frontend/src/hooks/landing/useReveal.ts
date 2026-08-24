import { useEffect } from 'react';

export function useReveal() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -30px' });

    for (const item of items) {
      observer.observe(item);
    }

    return () => {
      observer.disconnect();
    };
  }, []);
}
