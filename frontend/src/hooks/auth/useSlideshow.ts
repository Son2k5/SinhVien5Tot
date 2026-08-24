import { useEffect, useState } from 'react';

/**
 * Quản lý slideshow tự động chuyển slide theo chu kỳ.
 * @param count Tổng số slides
 * @param intervalMs Thời gian mỗi slide (ms), mặc định 6500ms
 */
export function useSlideshow(count: number, intervalMs = 6500) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(
      () => setSlide((value) => (value + 1) % count),
      intervalMs,
    );
    return () => window.clearInterval(interval);
  }, [count, intervalMs]);

  return { slide, setSlide };
}
