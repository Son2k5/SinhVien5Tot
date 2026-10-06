import { useEffect, useState } from 'react';

export function useSlideshow(count: number, intervalMs = 5000) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % count);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [count, intervalMs]);

  return { slide, setSlide };
}

export default useSlideshow;
