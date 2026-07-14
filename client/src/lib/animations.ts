import { useEffect, useState } from 'react';
import type { Variants } from 'framer-motion';

// ── Standard variants (no reduced-motion) ──────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const fadeInFromLeft: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// ── Reduced-motion variants (opacity only, no transform) ───────────

const fadeUpReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0 },
  },
};

const fadeInReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0 },
  },
};

const fadeInFromLeftReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0 },
  },
};

const staggerContainerReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0,
    },
  },
};

// ── Hook: composes variants based on prefers-reduced-motion ────────

export function useReducedMotion(): {
  fadeUp: Variants;
  fadeIn: Variants;
  fadeInFromLeft: Variants;
  staggerContainer: Variants;
} {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (reduced) {
    return {
      fadeUp: fadeUpReduced,
      fadeIn: fadeInReduced,
      fadeInFromLeft: fadeInFromLeftReduced,
      staggerContainer: staggerContainerReduced,
    };
  }

  return { fadeUp, fadeIn, fadeInFromLeft, staggerContainer };
}
