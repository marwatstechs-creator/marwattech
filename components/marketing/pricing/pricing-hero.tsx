"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, animate } from "framer-motion";

import { AppIcon } from "@/components/app-icon";
import { GuaranteeSeal } from "@/components/marketing/guarantee-seal";
import { cn } from "@/lib/utils";
import { monthlyCost, monthlyHours, moneyExact, DEV_TIERS } from "@/lib/pricing";
import { EASE, fadeUp, maskReveal, staggerContainer } from "./pricing-anim";

function PriceCountUp({ to, delay = 0.6 }: { to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.4,
      delay,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, to, delay]);

  return <span ref={ref} className="tabular-nums">{moneyExact(display)}</span>;
}

const BADGES = [
  { icon: "medal" as const, label: "Top Rated" },
  { icon: "clock" as const, label: "Matched in Days" },
  { icon: "shield" as const, label: "14-Day Risk-Free" },
];

export function PricingHero() {
  const baseline = monthlyCost(DEV_TIERS[0], 40);

  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-6 sm:pt-20 lg:px-8">
      {/* Soft radial glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[min(90vw,900px)] -translate-x-1/2 opacity-60"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--color-primary) 16%, transparent), transparent)" }}
      />

      {/* Rotating guarantee seal — top-right background accent */}
      <div aria-hidden className="pointer-events-none absolute -right-8 top-8 -z-10 hidden rotate-6 opacity-70 lg:block xl:right-16">
        <GuaranteeSeal className="h-56 w-56 text-primary" />
      </div>

      <motion.div
        variants={staggerContainer(0.14, 0.05)}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-4xl flex-col items-center gap-7 text-center"
      >
        {/* Eyebrow */}
        <motion.span
          variants={fadeUp(0)}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          Transparent Pricing
          <span className="size-1.5 rounded-full bg-primary" />
        </motion.span>

        {/* Headline — masked line reveal */}
        <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-6xl lg:text-[72px]">
          <span className="block overflow-hidden pb-1">
            <motion.span variants={maskReveal(0.1)} className="block">
              Serious Devs.
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-2">
            <motion.span
              variants={maskReveal(0.2)}
              className="block bg-gradient-to-r from-primary via-gold to-primary bg-clip-text text-transparent"
            >
              Serious Value.
            </motion.span>
          </span>
        </h1>

        {/* Sub */}
        <motion.p variants={fadeUp(0.3)} className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Vetted engineers, billed by the hour and matched to your stack — with a 14-day risk-free trial.
        </motion.p>

        {/* Big price */}
        <motion.div variants={fadeUp(0.4)} className="flex flex-col items-center gap-2">
          <p className="font-display text-6xl font-bold sm:text-7xl">
            <span className="align-top text-3xl text-primary sm:text-4xl">$</span>
            <PriceCountUp to={DEV_TIERS[0].pricePerHour} />
            <span className="text-2xl font-normal text-muted-foreground sm:text-3xl">/hr</span>
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            From · {monthlyHours(40)} hours ~ {moneyExact(baseline)}/month · no recruiter fees
          </p>
        </motion.div>

        {/* Badge chips */}
        <motion.div variants={fadeUp(0.5)} className="flex flex-wrap items-center justify-center gap-2.5">
          {BADGES.map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground/70"
            >
              <AppIcon name={b.icon} size={14} className="text-primary" />
              {b.label}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div variants={fadeUp(0.6)} className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/get-started"
            className="group inline-flex h-12 items-center gap-3 rounded-full bg-primary pl-6 pr-2 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            Get Matched
            <span className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-black/10">
              <AppIcon name="arrowRight" size={18} className="transition-transform duration-300 group-hover:translate-x-[220%]" />
              <AppIcon name="arrowRight" size={18} className="absolute -translate-x-[220%] transition-transform duration-300 group-hover:translate-x-0" />
            </span>
          </Link>
          <Link
            href="/portfolio"
            className={cn(
              "group inline-flex h-12 items-center gap-2 rounded-full border bg-card px-6 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-accent-hover"
            )}
          >
            See Our Work
            <AppIcon name="arrowUpRight" size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Animated underline ticker of guarantees */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
        className="mx-auto mt-12 h-px w-full max-w-3xl origin-center bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
    </section>
  );
}
