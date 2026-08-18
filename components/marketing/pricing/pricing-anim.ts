import type { Variants } from "framer-motion";

/** Smooth "premium" easing used across the marketing motion. */
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Fade up + settle. */
export function fadeUp(delay = 0): Variants {
  return {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
  };
}

/** Masked line reveal (text slides up out of an overflow-hidden wrapper). */
export function maskReveal(delay = 0): Variants {
  return {
    hidden: { y: "115%", opacity: 0 },
    show: { y: "0%", opacity: 1, transition: { duration: 0.8, ease: EASE, delay } },
  };
}

/** Parent that staggers its children. */
export function staggerContainer(staggerChildren = 0.12, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  };
}

/** Fade + slight rise for whole blocks (cards, rows). */
export function rise(delay = 0): Variants {
  return {
    hidden: { opacity: 0, y: 32, scale: 0.99 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE, delay } },
  };
}
