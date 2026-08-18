"use client";

import Link from "next/link";
import { useRef, type MouseEvent as ReactMouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";

import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
import {
  DEV_TIERS,
  monthlyCost,
  monthlyHours,
  moneyExact,
  type DevTier,
} from "@/lib/pricing";
import { fadeUp, rise, staggerContainer } from "./pricing-anim";

const HOURS_PER_WEEK = 40; // baseline shown on the cards (160h/month)

/* ── 3D tilt card ───────────────────────────────────────────────────── */

function TierCard({ tier, index }: { tier: DevTier; index: number }) {
  const featured = tier.popular;
  const monthly = monthlyCost(tier, HOURS_PER_WEEK);

  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 22 });
  const sry = useSpring(ry, { stiffness: 180, damping: 22 });

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 7);
    rx.set(-py * 7);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div variants={rise(index * 0.08)} className="h-full">
      <motion.article
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
        whileHover={{ y: -10, transition: { duration: 0.25 } }}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card will-change-transform",
          featured
            ? "border-primary shadow-2xl shadow-primary/15"
            : "border-border hover:border-primary/40"
        )}
      >
        {/* Hover glow */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500",
            featured ? "bg-primary/5 group-hover:opacity-100" : "bg-primary/[0.03] group-hover:opacity-100"
          )}
        />

        {featured && (
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30"
          >
            Most Popular
          </motion.span>
        )}

        <div
          className={cn(
            "relative flex flex-col gap-5 p-7",
            featured ? "bg-primary/5" : "border-b"
          )}
        >
          <div className="flex min-h-[52px] flex-col gap-1">
            <h3 className="font-display text-lg font-bold leading-snug">{tier.label}</h3>
            <p className="text-sm text-muted-foreground">{tier.tagline}</p>
          </div>
          <div className="flex items-end gap-2">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
              className="font-display text-5xl font-bold tracking-tight"
            >
              {moneyExact(tier.pricePerHour)}
            </motion.span>
            <span className="pb-1.5 text-sm font-medium text-muted-foreground">/ hour</span>
          </div>
          <p className="text-sm font-semibold text-primary">
            {monthlyHours(HOURS_PER_WEEK)} hours ~ {moneyExact(monthly)}/month
          </p>
        </div>

        <div className="relative flex flex-1 flex-col gap-7 p-7">
          <ul className="flex flex-col gap-4">
            {tier.features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm font-medium">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                  <AppIcon name="check" size={14} />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className={cn(
              "group/btn mt-auto inline-flex items-center justify-between rounded-full py-2.5 pl-6 pr-2.5 font-display text-sm font-semibold transition-all duration-300",
              featured
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "border bg-background hover:border-primary/40 hover:bg-accent-hover"
            )}
          >
            Get Started
            <span
              className={cn(
                "relative grid size-9 place-items-center overflow-hidden rounded-full transition-colors",
                featured ? "bg-black/10" : "bg-primary/10 text-primary"
              )}
            >
              <AppIcon name="arrowRight" size={18} className="transition-transform duration-300 group-hover/btn:translate-x-[220%]" />
              <AppIcon name="arrowRight" size={18} className="absolute -translate-x-[220%] transition-transform duration-300 group-hover/btn:translate-x-0" />
            </span>
          </Link>
        </div>
      </motion.article>
    </motion.div>
  );
}

/* ── Section ────────────────────────────────────────────────────────── */

export function PricingTiers() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <motion.div
        variants={staggerContainer(0.12)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mb-10 flex flex-col items-center gap-3 text-center"
      >
        <motion.span
          variants={fadeUp()}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
        >
          <span className="size-2 rounded-[2px] bg-primary" />
          The Tiers
        </motion.span>
        <motion.h2 variants={fadeUp(0.05)} className="font-display text-3xl font-bold sm:text-4xl">
          Pick Your Tier.
        </motion.h2>
        <motion.p variants={fadeUp(0.1)} className="text-sm text-muted-foreground">
          Hover the cards to compare.
        </motion.p>
      </motion.div>

      <motion.div
        variants={staggerContainer(0.1, 0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="grid gap-6 lg:grid-cols-3 lg:items-stretch"
      >
        {DEV_TIERS.map((tier, i) => (
          <TierCard key={tier.id} tier={tier} index={i} />
        ))}
      </motion.div>
    </section>
  );
}
