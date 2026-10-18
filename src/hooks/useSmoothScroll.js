import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

// Inertial "cinematic" smooth scrolling for mouse wheels and trackpads.
// Touch devices keep their native scrolling; reduced-motion users are left untouched.
export default function useSmoothScroll(pathname) {
  const lenis = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const instance = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenis.current = instance;
    window.__lenis = instance;
    let frame;
    const raf = (time) => {
      instance.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  // Jump to the top on every page change.
  useEffect(() => {
    if (lenis.current) lenis.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);
}
