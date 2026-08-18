"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/** Premium slide-up/roll easing (no bounce, no overshoot). */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type RotatingWordProps = {
  /** Words to cycle through, e.g. ["Perform", "Convert", "Scale"]. */
  words: string[];
  /** How long each word stays visible, in ms. Default 2500. */
  duration?: number;
  /** Slide transition length, in seconds. Default 0.6. */
  transition?: number;
  /** Extra classes for the animated container (color/gradient etc.). */
  className?: string;
};

/**
 * Vertically rolling word that loops through `words`.
 *
 * Uses an inline-grid with a hidden "widest word" spacer so the column width
 * is stable — words of different lengths never shift the surrounding layout.
 * The incoming word slides up from `100%` while the outgoing word rolls out to
 * `-100%`, with a subtle opacity fade and a premium cubic-bezier ease.
 *
 * Respects `prefers-reduced-motion` (renders the first word statically).
 */
export function RotatingWord({
  words,
  duration = 2500,
  transition = 0.6,
  className,
}: RotatingWordProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || words.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, duration);
    return () => window.clearInterval(id);
  }, [duration, reduce, words.length]);

  if (reduce || words.length <= 1) {
    return <span className={className}>{words[0]}</span>;
  }

  const word = words[index];

  // Widest word reserves the column width so there is no layout shift.
  const widest = words.reduce((a, b) => (b.length > a.length ? b : a));

  return (
    <span className={cn("inline-grid overflow-hidden align-bottom", className)}>
      <AnimatePresence initial={false}>
        <motion.span
          key={word}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: transition, ease: EASE }}
          className="whitespace-nowrap"
          style={{ gridArea: "1 / 1" }}
        >
          {word}
        </motion.span>
      </AnimatePresence>
      {/* Invisible spacer keeps the grid column at the widest word's width */}
      <span
        aria-hidden
        className="invisible whitespace-nowrap"
        style={{ gridArea: "1 / 1" }}
      >
        {widest}
      </span>
    </span>
  );
}
