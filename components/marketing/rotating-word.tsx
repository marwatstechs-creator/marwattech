"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/** Premium slide-up/roll easing (no bounce, no overshoot). */
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type RotatingWordProps = {
  /** Words to cycle through, e.g. ["Perform", "Convert", "Scale"]. */
  words: string[];
  /** How long each word stays visible, in ms. Default 2500. */
  duration?: number;
  /** Slide transition length, in seconds. Default 0.6. */
  transition?: number;
  /** Classes applied to each word (color/gradient etc.). */
  className?: string;
};

/**
 * Vertically rolling word that loops through `words`.
 *
 * Uses a fixed-height "slot-machine" track with a single CSS transform
 * transition — glitch-free and cheap to run:
 *   - The track reserves the widest word's width, so there is NO layout shift.
 *   - Incoming word slides up from below, outgoing rolls out above, with a
 *     premium cubic-bezier ease.
 *   - The first word is duplicated at the end so the loop rolls seamlessly.
 *   - Respects `prefers-reduced-motion` (renders the first word statically).
 *
 * `className` is applied to EACH word so gradient/bg-clip-text styles render
 * on the actual text (not on the clipping container).
 */
export function RotatingWord({
  words,
  duration = 2500,
  transition = 0.6,
  className,
}: RotatingWordProps) {
  const reduce = useReducedMotion();
  // Duplicate the first word so the loop can roll up seamlessly.
  const list = useMemo(() => (words.length > 1 ? [...words, words[0]] : words), [words]);
  const wrapping = useRef(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce || words.length <= 1) return;
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= words.length) {
          // Rolled onto the duplicate of the first word → jump back invisibly.
          wrapping.current = true;
          return 0;
        }
        wrapping.current = false;
        return s + 1;
      });
    }, duration);
    return () => window.clearInterval(id);
  }, [duration, reduce, words.length]);

  if (reduce || words.length <= 1) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className="inline-block overflow-hidden align-bottom" style={{ height: "1lh" }}>
      <span
        className="block will-change-transform"
        style={{
          transform: `translateY(calc(${-step} * 1lh))`,
          transition: wrapping.current
            ? "none"
            : `transform ${transition}s cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        {list.map((w, i) => (
          <span
            key={`${w}-${i}`}
            className={cn("block whitespace-nowrap", className)}
            style={{ height: "1lh" }}
          >
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}
