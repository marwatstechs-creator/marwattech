"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  Satellite,
  Radio,
  Globe,
  Radar,
  Cpu,
  Signal,
  Sun,
  Moon,
  Orbit,
  Navigation,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/app-icon";

/* ── Decorative data ─────────────────────────────────────────────────── */

type Star = { l: number; t: number; c: "primary" | "secondary" | "muted"; w: number; h: number; s: number };

const STARS: Star[] = [
  { l: 94.79, t: 6.78, c: "secondary", w: 4, h: 3, s: 0.35 },
  { l: 43.15, t: 0.17, c: "primary", w: 4, h: 3, s: 1.74 },
  { l: 36.96, t: 7.96, c: "muted", w: 1, h: 3, s: 1.86 },
  { l: 43.74, t: 38.34, c: "primary", w: 3, h: 2, s: 0.3 },
  { l: 85.46, t: 91.79, c: "primary", w: 3, h: 2, s: 1.85 },
  { l: 24.66, t: 54.05, c: "secondary", w: 4, h: 1, s: 0.59 },
  { l: 88.58, t: 75.49, c: "muted", w: 2, h: 2, s: 1.5 },
  { l: 89.15, t: 41.29, c: "muted", w: 3, h: 4, s: 1.03 },
  { l: 25.0, t: 9.71, c: "primary", w: 4, h: 4, s: 0.32 },
  { l: 16.62, t: 53.85, c: "secondary", w: 1, h: 1, s: 2.0 },
  { l: 52.88, t: 43.75, c: "muted", w: 1, h: 2, s: 2.0 },
  { l: 7.93, t: 78.05, c: "secondary", w: 2, h: 2, s: 1.9 },
  { l: 90.87, t: 72.01, c: "muted", w: 5, h: 3, s: 1.2 },
  { l: 30.84, t: 3.98, c: "muted", w: 3, h: 1, s: 0.34 },
  { l: 52.57, t: 35.12, c: "secondary", w: 2, h: 3, s: 0.32 },
  { l: 0.78, t: 68.97, c: "secondary", w: 4, h: 2, s: 0.59 },
  { l: 77.25, t: 61.82, c: "muted", w: 2, h: 3, s: 0.53 },
  { l: 18.82, t: 60.27, c: "secondary", w: 3, h: 1, s: 1.72 },
  { l: 83.51, t: 13.02, c: "muted", w: 4, h: 1, s: 1.93 },
  { l: 89.42, t: 25.26, c: "primary", w: 3, h: 3, s: 0.52 },
  { l: 97.42, t: 54.52, c: "primary", w: 2, h: 3, s: 0.53 },
  { l: 50.12, t: 20.68, c: "muted", w: 5, h: 4, s: 0.74 },
  { l: 41.9, t: 90.56, c: "secondary", w: 2, h: 4, s: 0.3 },
  { l: 82.77, t: 11.52, c: "muted", w: 4, h: 2, s: 0.52 },
  { l: 91.02, t: 16.01, c: "muted", w: 1, h: 4, s: 0.71 },
  { l: 92.36, t: 61.54, c: "primary", w: 3, h: 3, s: 0.41 },
  { l: 37.69, t: 23.61, c: "muted", w: 4, h: 1, s: 0.46 },
  { l: 59.55, t: 13.46, c: "secondary", w: 2, h: 2, s: 0.33 },
  { l: 71.6, t: 8.84, c: "primary", w: 3, h: 2, s: 1.97 },
  { l: 91.82, t: 84.7, c: "primary", w: 2, h: 3, s: 1.76 },
  { l: 31.63, t: 20.8, c: "primary", w: 2, h: 1, s: 1.45 },
  { l: 85.61, t: 33.6, c: "primary", w: 1, h: 2, s: 0.3 },
  { l: 58.54, t: 98.53, c: "secondary", w: 2, h: 4, s: 1.94 },
  { l: 42.56, t: 97.54, c: "secondary", w: 3, h: 3, s: 1.43 },
];

const STAR_COLORS: Record<Star["c"], string> = {
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  muted: "var(--muted-foreground)",
};

/* ── Background decor ────────────────────────────────────────────────── */

function Stars() {
  return (
    <>
      {STARS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.l}%`,
            top: `${s.t}%`,
            width: s.w,
            height: s.h,
            backgroundColor: STAR_COLORS[s.c],
            transform: `scale(${s.s}) rotate(${i * 37}deg)`,
          }}
          animate={{ opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 3 + (i % 5), repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.4 }}
        />
      ))}
    </>
  );
}

function FloatIcon({
  icon,
  className,
  posClass,
  dur = 6,
  delay = 0,
}: {
  icon: React.ReactNode;
  className?: string;
  posClass: string;
  dur?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute ${posClass}`}
      animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
      transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {icon}
    </motion.div>
  );
}

/* ── Orbit "404" with Marwat Tech logo ───────────────────────────────── */

function OrbitMark() {
  return (
    <div className="inline-block relative mx-4 md:mx-8 align-middle">
      <div className="relative w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40">
        {/* concentric rotating rings */}
        <motion.div
          className="absolute inset-0 border border-primary/25 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-1 border border-secondary/20 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 19, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-3 border border-primary/15 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-5 border border-secondary/10 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-6 bg-primary/15 rounded-full">
          <div className="absolute inset-1 bg-primary/25 rounded-full border-2 border-primary/50 flex items-center justify-center overflow-hidden">
            {/* Marwat Tech logo in the center (replaces the rocket) */}
            <img
              src="/assets/logo-light-square.svg"
              alt="Marwat Tech"
              className="h-3/5 w-3/5 object-contain dark:hidden"
              draggable={false}
            />
            <img
              src="/assets/logo-dark-square.svg"
              alt="Marwat Tech"
              className="hidden h-3/5 w-3/5 object-contain dark:block"
              draggable={false}
            />
          </div>
        </div>

        {/* orbiting satellite icons */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        >
          <Orbit className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 text-primary/70" />
          <Navigation className="absolute top-1/2 -right-3 -translate-y-1/2 w-3 h-3 text-secondary/60" />
          <Target className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 text-primary/50" />
        </motion.div>

        {/* launch trail */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute -bottom-1 left-1/2 w-1 h-1 bg-secondary rounded-full"
            animate={{ y: [0, 34], opacity: [0, 0.75, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.16, ease: "easeOut" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main 404 page ───────────────────────────────────────────────────── */

export function NotFoundCosmic() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* blurred orbs */}
      <div className="absolute top-20 left-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-32 right-16 h-32 w-32 rounded-full bg-secondary/5 blur-2xl" />

      {/* starfield */}
      <Stars />

      {/* gradient streaks */}
      <motion.div
        className="absolute h-0.5 w-28 opacity-80"
        style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }}
        animate={{ opacity: [0.1, 0.6, 0.1], x: [0, 24, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-0.5 w-20 opacity-60"
        style={{ top: 22, left: "58%", background: "linear-gradient(90deg, transparent, var(--secondary), transparent)" }}
        animate={{ opacity: [0.1, 0.5, 0.1], x: [0, -18, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute h-0.5 w-16 opacity-40"
        style={{ top: 38, left: "12%", background: "linear-gradient(90deg, transparent, var(--muted-foreground), transparent)" }}
        animate={{ opacity: [0.1, 0.4, 0.1], x: [0, 16, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* floating tech icons */}
      <FloatIcon posClass="top-16 right-24" dur={7} icon={<Satellite className="h-7 w-7 text-primary/50" />} />
      <FloatIcon posClass="bottom-28 left-16" dur={8} delay={0.5} icon={<Radio className="h-6 w-6 text-secondary/60" />} />
      <FloatIcon posClass="top-1/4 left-20" dur={9} delay={1} icon={<Globe className="h-5 w-5 text-primary/40" />} />
      <FloatIcon posClass="top-2/3 right-1/4" dur={7.5} delay={0.3} icon={<Radar className="h-4 w-4 text-secondary/50" />} />
      <FloatIcon posClass="top-1/5 right-1/3" dur={8.5} delay={0.8} icon={<Cpu className="h-4 w-4 text-primary/45" />} />
      <FloatIcon posClass="bottom-1/3 left-1/3" dur={6.5} delay={1.3} icon={<Signal className="h-4 w-4 text-secondary/55" />} />
      <FloatIcon posClass="top-10 left-1/2" dur={10} delay={0.2} icon={<Sun className="h-3 w-3 text-primary/30" />} />
      <FloatIcon posClass="bottom-20 right-10" dur={9.5} delay={0.9} icon={<Moon className="h-4 w-4 text-secondary/40" />} />
      {/* floating shapes */}
      <FloatIcon posClass="top-1/3 left-1/5" dur={8} delay={0.4} icon={<div className="h-5 w-5 rotate-45 border border-primary/50 bg-primary/25" />} />
      <FloatIcon posClass="top-3/4 right-1/5" dur={7.5} delay={1.1} icon={<div className="h-4 w-4 rounded-full border border-secondary/60 bg-secondary/30" />} />

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="relative z-10 max-w-3xl text-center">
        <div className="mb-10">
          <div className="relative">
            <span className="inline-block select-none text-[6rem] font-black text-foreground/25 md:text-[9rem] lg:text-[12rem]">
              4
            </span>
            <OrbitMark />
            <span className="inline-block select-none text-[6rem] font-black text-foreground/25 md:text-[9rem] lg:text-[12rem]">
              4
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2">
          <Zap className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium text-secondary">LOST IN SPACE</span>
        </div>

        <div className="mt-6 space-y-4">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Houston, we have a problem
            <span className="block pt-1 text-xl text-primary md:text-2xl">
              This page drifted off course
            </span>
          </h1>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button size="lg" className="whitespace-nowrap">
              <AppIcon name="home" size={16} />
              Back to Home
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="whitespace-nowrap">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
