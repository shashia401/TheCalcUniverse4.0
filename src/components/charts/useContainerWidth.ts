import { useEffect, useRef, useState } from 'react';

/** Tracks an element's rendered width so SVG charts can draw in real pixels. */
export function useContainerWidth(initial = 320) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.max(160, Math.round(el.getBoundingClientRect().width)));
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(160, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
