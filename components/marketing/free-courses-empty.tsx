"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import type { IconName } from "@/lib/icons";

/**
 * Modern animated empty state for the Free Courses page.
 *
 * Renders a rich gradient card with floating watermark icons, an aurora
 * glow, a pulsing ring around a central rocket tile and a compelling
 * message that nudges visitors to come back in a few hours for fresh
 * 100% OFF course drops.
 */

type Floater = {
  icon: IconName;
  size: number;
  className: string;
  rotate: number;
  delay: number;
  color: string;
  duration: number;
  drift: number;
};

const FLOATERS: Floater[] = [
  {
    icon: "rocket",
    size: 110,
    className: "-top-8 -left-6",
    rotate: -18,
    delay: 0,
    color: "text-gold/20",
    duration: 6,
    drift: 14,
  },
  {
    icon: "sparkles",
    size: 70,
    className: "top-8 -right-5",
    rotate: 12,
    delay: 0.5,
    color: "text-white/15",
    duration: 7,
    drift: 10,
  },
  {
    icon: "star",
    size: 56,
    className: "bottom-16 -left-4",
    rotate: 8,
    delay: 1,
    color: "text-gold/25",
    duration: 8,
    drift: 12,
  },
  {
    icon: "bell",
    size: 88,
    className: "-bottom-8 right-12",
    rotate: -10,
    delay: 0.8,
    color: "text-white/15",
    duration: 6.5,
    drift: 16,
  },
  {
    icon: "clock",
    size: 48,
    className: "top-1/3 -right-3",
    rotate: 6,
    delay: 1.3,
    color: "text-gold/20",
    duration: 7.5,
    drift: 9,
  },
  {
    icon: "megaphone",
    size: 62,
    className: "-bottom-6 left-1/4",
    rotate: 14,
    delay: 1.6,
    color: "text-white/10",
    duration: 8.5,
    drift: 11,
  },
];

const CHIPS = [
  { icon: "refresh" as IconName, label: "New drops every few hours" },
  { icon: "sparkles" as IconName, label: "Codes go fast — grab yours early" },
  { icon: "star" as IconName, label: "100% free, always" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 15 } },
};

export function FreeCoursesEmpty() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();

  const remind = () => {
    toast("⏰ Reminder set — come back in a few hours!", {
      description:
        "Fresh 100% OFF courses drop here every few hours. Bookmark this page so you never miss the next wave.",
    });
  };

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-3xl border border-primary/25 shadow-[0_24px_70px_-24px_rgba(116,100,198,0.55)]"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#8b7dd4] to-azure" />

      {/* Aurora glow blobs */}
      <motion.div
        aria-hidden
        className="absolute -left-24 -top-24 size-72 rounded-full bg-gold/25 blur-3xl"
        animate={reduce ? undefined : { x: [0, 44, 0], y: [0, 32, 0], scale: [1, 1.18, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-24 -right-16 size-80 rounded-full bg-white/20 blur-3xl"
        animate={reduce ? undefined : { x: [0, -32, 0], y: [0, -44, 0], scale: [1, 1.22, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        aria-hidden
        className="absolute right-1/4 top-1/3 size-56 rounded-full bg-[#b3a6e6]/50 blur-3xl"
        animate={reduce ? undefined : { x: [0, 26, 0], y: [0, -26, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Floating watermark icons */}
      {FLOATERS.map((f) => (
        <motion.span
          key={f.icon}
          aria-hidden
          className={`pointer-events-none absolute ${f.className} ${f.color}`}
          animate={
            reduce
              ? undefined
              : { y: [0, -f.drift, 0], rotate: [f.rotate, f.rotate + 7, f.rotate] }
          }
          transition={{ duration: f.duration, repeat: Infinity, ease: "easeInOut", delay: f.delay }}
        >
          <AppIcon name={f.icon} size={f.size} />
        </motion.span>
      ))}

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="relative px-6 py-14 text-center sm:px-12 sm:py-16"
      >
        {/* Badge */}
        <motion.div variants={item}>
          <Badge
            variant="gold"
            className="mb-7 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-foreground/60 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-gold-foreground" />
            </span>
            Fresh drops incoming
          </Badge>
        </motion.div>

        {/* Central rocket tile with pulse rings */}
        <motion.div variants={item} className="relative mx-auto mb-7 grid size-24 place-items-center">
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-white/25"
            animate={reduce ? undefined : { scale: [1, 1.7], opacity: [0.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-white/15"
            animate={reduce ? undefined : { scale: [1, 1.7], opacity: [0.4, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
          />
          <span className="icon-3d-tile relative grid size-24 place-items-center rounded-2xl bg-white/15 text-gold ring-1 ring-white/25 backdrop-blur">
            <AppIcon name="rocket" size={46} />
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          variants={item}
          className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
        >
          Every free course just got claimed — new ones land in a few hours
        </motion.h2>

        {/* Sub copy */}
        <motion.p
          variants={item}
          className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base"
        >
          The 100% OFF codes went <strong className="text-gold">fast</strong> (as always! 🔥).
          Brand-new free courses drop here <strong className="text-gold">every few hours</strong> —
          come back soon to grab the freshest deals before they expire.
        </motion.p>

        {/* Reassurance chips */}
        <motion.div
          variants={item}
          className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2.5"
        >
          {CHIPS.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur"
            >
              <AppIcon name={c.icon} size={14} className="text-gold" />
              {c.label}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <button
            type="button"
            onClick={remind}
            className="btn-3d-gold inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
          >
            <AppIcon name="bell" size={16} />
            Remind me — check back in a few hours
          </button>
          <a
            href="/services"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <AppIcon name="tag" size={16} className="text-gold" />
            Explore our services
            <AppIcon name="arrowRight" size={15} />
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
