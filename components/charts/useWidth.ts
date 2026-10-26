"use client";

import { useEffect, useRef, useState } from "react";

// Charts draw in real pixels at the container's width, so 12px labels and 8px dots stay that
// size on any screen instead of scaling with a fixed viewBox.
// Width is 0 until measured, so server HTML never forces a fixed-width SVG onto a phone.
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
