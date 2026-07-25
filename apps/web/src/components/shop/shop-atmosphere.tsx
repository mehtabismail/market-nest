'use client';

import { useEffect, useRef } from 'react';

/**
 * Cursor-tracked spotlight for the Spatial Glass canvas. Renders a fixed radial
 * orb (`.shop-spotlight`) and moves it with the pointer via `translate3d` only
 * — GPU-composited, so it never triggers layout or paint (stays at 60fps).
 * Disabled under reduced-motion or coarse (touch) pointers.
 */
export function ShopAtmosphere() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduce || coarse) return;

    const el = ref.current;
    if (!el) return;
    let frame = 0;

    function onMove(e: MouseEvent) {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        el!.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        frame = 0;
      });
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} aria-hidden className="shop-spotlight" style={{ zIndex: 0 }} />;
}
