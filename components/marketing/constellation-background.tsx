"use client";

import * as React from "react";
import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Animated "constellation" background: scattered service icons that gently
 * twinkle/shine with a subtle mouse-parallax drift. Used as a decorative
 * layer behind the CTA banner.
 *
 * Color inherits from the wrapper `className` (e.g. `text-primary-foreground`).
 */
type Cell = {
  icon: IconName;
  left: string;
  top: string;
  size: number;
  opacity: number;
  pf: number; // parallax strength (px)
  duration: number; // s
  delay: number; // s
  shine?: boolean; // use the shine keyframe instead of twinkle
  dx: number;
  dy: number;
  hiddenSm?: boolean; // hide on small screens (decorative only)
};

const CELLS: Cell[] = [
  { icon: "code", left: "7%", top: "12%", size: 18, opacity: 0.22, pf: 3, duration: 9, delay: 0.73, dx: 2, dy: -3, hiddenSm: true },
  { icon: "ecommerce", left: "16%", top: "82%", size: 22, opacity: 0.16, pf: 4, duration: 10, delay: 1.46, dx: -4, dy: -2 },
  { icon: "seo", left: "24%", top: "18%", size: 20, opacity: 0.3, pf: 5, duration: 11, delay: 2.19, dx: 2, dy: 2, hiddenSm: true },
  { icon: "ai", left: "31%", top: "76%", size: 16, opacity: 0.1, pf: 2, duration: 8, delay: 3.65, dx: 2, dy: 4 },
  { icon: "mobile", left: "38%", top: "10%", size: 24, opacity: 0.16, pf: 5, duration: 9, delay: 4.38, dx: -4, dy: -4, shine: true },
  { icon: "design", left: "46%", top: "84%", size: 18, opacity: 0.2, pf: 3, duration: 10, delay: 5.11, dx: 2, dy: -3, hiddenSm: true },
  { icon: "rocket", left: "54%", top: "14%", size: 20, opacity: 0.3, pf: 6, duration: 12, delay: 6.57, dx: 2, dy: 2 },
  { icon: "target", left: "62%", top: "80%", size: 16, opacity: 0.1, pf: 3, duration: 8, delay: 7.3, dx: -4, dy: 3, hiddenSm: true },
  { icon: "chart", left: "70%", top: "9%", size: 22, opacity: 0.16, pf: 4, duration: 9, delay: 0.03, dx: 2, dy: 4 },
  { icon: "globe", left: "78%", top: "86%", size: 18, opacity: 0.2, pf: 5, duration: 11, delay: 1.49, dx: 2, dy: -3, hiddenSm: true },
  { icon: "shield", left: "86%", top: "16%", size: 20, opacity: 0.3, pf: 3, duration: 9, delay: 1.13, dx: -3, dy: 4 },
  { icon: "database", left: "93%", top: "72%", size: 16, opacity: 0.16, pf: 6, duration: 10, delay: 1.86, dx: 3, dy: -4 },
  { icon: "sparkles", left: "5%", top: "48%", size: 20, opacity: 0.3, pf: 4, duration: 11, delay: 2.59, dx: -3, dy: -3, hiddenSm: true },
  { icon: "layers", left: "14%", top: "36%", size: 16, opacity: 0.1, pf: 2, duration: 8, delay: 4.05, dx: -3, dy: 2, shine: true },
  { icon: "terminal", left: "24%", top: "58%", size: 24, opacity: 0.16, pf: 5, duration: 9, delay: 4.78, dx: 3, dy: 3 },
  { icon: "box", left: "34%", top: "30%", size: 18, opacity: 0.2, pf: 3, duration: 10, delay: 5.51, dx: -3, dy: 4, hiddenSm: true },
  { icon: "dashboard", left: "44%", top: "66%", size: 20, opacity: 0.3, pf: 6, duration: 12, delay: 6.97, dx: -3, dy: -3 },
  { icon: "analytics", left: "54%", top: "28%", size: 16, opacity: 0.06, pf: 2, duration: 8, delay: 7.7, dx: 3, dy: -2, hiddenSm: true },
  { icon: "award", left: "64%", top: "62%", size: 22, opacity: 0.16, pf: 5, duration: 9, delay: 0.43, dx: -3, dy: 2 },
  { icon: "medal", left: "74%", top: "34%", size: 18, opacity: 0.2, pf: 4, duration: 11, delay: 1.89, dx: -3, dy: 4, shine: true, hiddenSm: true },
  { icon: "building", left: "84%", top: "58%", size: 20, opacity: 0.3, pf: 3, duration: 12, delay: 2.62, dx: 3, dy: -4 },
  { icon: "briefcase", left: "92%", top: "42%", size: 16, opacity: 0.1, pf: 2, duration: 10, delay: 2.26, dx: -2, dy: 3 },
  { icon: "nextjs", left: "9%", top: "70%", size: 18, opacity: 0.16, pf: 3, duration: 11, delay: 2.99, dx: 4, dy: 4 },
  { icon: "wordpress", left: "20%", top: "90%", size: 20, opacity: 0.2, pf: 5, duration: 8, delay: 4.45, dx: 4, dy: -3, hiddenSm: true },
];

const KEYFRAMES = `
  .block-constellation-cell {
    transform: translate(
      calc(-50% + var(--pf, 3px) * var(--mx, 0)),
      calc(-50% + var(--pf, 3px) * var(--my, 0))
    );
    will-change: transform;
  }
  @keyframes block-star-twinkle {
    0%, 100% {
      opacity: var(--base-op, 0.2);
      transform: translate(calc(var(--dx, 0px) * -0.5), calc(var(--dy, 0px) * -0.5));
    }
    50% {
      opacity: calc(var(--base-op, 0.2) * 0.35);
      transform: translate(calc(var(--dx, 0px) * 0.5), calc(var(--dy, 0px) * 0.5));
    }
  }
  @keyframes block-star-shine {
    0%, 82%, 100% {
      opacity: var(--base-op, 0.2);
      transform: translate(calc(var(--dx, 0px) * -0.5), calc(var(--dy, 0px) * -0.5));
    }
    88%, 94% {
      opacity: 0.7;
      transform: translate(calc(var(--dx, 0px) * 0.5), calc(var(--dy, 0px) * 0.5));
    }
  }
  @media (prefers-reduced-motion: reduce), (hover: none) {
    .block-constellation-cell,
    .block-constellation-inner {
      animation: none !important;
      transform: translate(-50%, -50%) !important;
    }
  }
`;

export function ConstellationBackground({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      el.style.setProperty("--mx", (((e.clientX - r.left) / r.width - 0.5) * 2 * 0.12).toFixed(3));
      el.style.setProperty("--my", (((e.clientY - r.top) / r.height - 0.5) * 2 * 0.12).toFixed(3));
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden opacity-70 sm:opacity-100", className)}
      style={{ "--mx": 0.12, "--my": 0.053 } as React.CSSProperties}
    >
      {CELLS.map((c, i) => (
        <span
          key={i}
          className={cn("block-constellation-cell absolute", c.hiddenSm && "hidden sm:block")}
          style={{ left: c.left, top: c.top, "--pf": `${c.pf}px` } as React.CSSProperties}
        >
          <span
            className="block-constellation-inner inline-flex"
            style={{
              opacity: c.opacity,
              animationName: c.shine ? "block-star-shine" : "block-star-twinkle",
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
              animationIterationCount: "infinite",
              animationTimingFunction: "ease-in-out",
              "--base-op": c.opacity,
              "--dx": `${c.dx}px`,
              "--dy": `${c.dy}px`,
            } as React.CSSProperties}
          >
            <AppIcon name={c.icon} size={c.size} />
          </span>
        </span>
      ))}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
    </div>
  );
}
