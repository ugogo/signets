import { useEffect, useState } from 'react';

/** True once the page scrolls past `threshold` px. */
export function useScrollCompact(threshold = 48): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return compact;
}
