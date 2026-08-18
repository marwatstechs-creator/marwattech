"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion } from "framer-motion";

import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
import {
  COMPETITORS,
  COMPETITOR_IDS,
  DEV_TIERS,
  money,
  moneyExact,
  monthlyCost,
  monthlyHours,
  type CompetitorId,
  type DevTierId,
} from "@/lib/pricing";
import { EASE, fadeUp, rise, staggerContainer } from "./pricing-anim";

function Slider({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <span className="text-sm font-medium text-foreground/80">{label}</span>
        <span className="flex items-baseline gap-1">
          <motion.span
            key={value}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="font-display text-3xl font-bold"
          >
            {value}
          </motion.span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--color-primary)]"
        aria-label={label}
      />
    </div>
  );
}

/** Re-animates from the previous value whenever the target changes. */
function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return <span className="tabular-nums">{format(display)}</span>;
}

export function PricingCalculator() {
  const [hours, setHours] = useState(40);
  const [months, setMonths] = useState(6);
  const [tierId, setTierId] = useState<DevTierId>("senior");
  const [compId, setCompId] = useState<CompetitorId>("toptal");

  const tier = DEV_TIERS.find((t) => t.id === tierId)!;
  const competitor = COMPETITORS[compId];

  const { marwatMonthly, marwatTotal, compTotal, savings, pct, devs } = useMemo(() => {
    const mm = monthlyCost(tier, hours);
    const mt = mm * months;
    const ct = competitor.monthly * months;
    const save = Math.max(0, ct - mt);
    return {
      marwatMonthly: mm,
      marwatTotal: mt,
      compTotal: ct,
      savings: save,
      pct: ct > 0 ? Math.round((save / ct) * 100) : 0,
      devs: mm > 0 ? competitor.monthly / mm : 0,
    };
  }, [tier, competitor, hours, months]);

  const maxCompMonthly = Math.max(...COMPETITOR_IDS.map((id) => COMPETITORS[id].monthly));

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        variants={staggerContainer(0.12)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mb-10 flex flex-col items-center gap-4 text-center"
      >
        <motion.span
          variants={fadeUp()}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary"
        >
          <span className="size-2 rounded-[2px] bg-primary" />
          Calculate Your Savings
        </motion.span>
        <motion.h2 variants={fadeUp(0.05)} className="font-display text-3xl font-bold sm:text-4xl">
          Don&apos;t overpay <span className="text-muted-foreground">for the logo.</span>
        </motion.h2>
        <motion.p variants={fadeUp(0.1)} className="max-w-xl text-sm text-muted-foreground sm:text-base">
          Pay for the talent, not the brand tax. Move the sliders and see the difference.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="overflow-hidden rounded-3xl border bg-card lg:flex"
      >
        {/* Controls */}
        <div className="flex flex-1 flex-col gap-8 p-8 sm:p-10">
          <h3 className="font-display text-xl font-bold">Configure your engagement</h3>
          <Slider label="Hours per week" value={hours} unit="hrs" min={5} max={60} onChange={setHours} />
          <Slider label="Engagement length" value={months} unit="months" min={1} max={24} onChange={setMonths} />

          <div className="flex flex-col gap-4">
            <span className="text-sm font-medium text-foreground/80">Developer tier</span>
            <div className="grid grid-cols-3 gap-2">
              {DEV_TIERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={tierId === t.id}
                  onClick={() => setTierId(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-sm transition-all duration-300",
                    tierId === t.id
                      ? "scale-[1.03] bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "border bg-background text-foreground hover:bg-accent-hover"
                  )}
                >
                  <span className="font-semibold">{t.short}</span>
                  <span className={cn("text-xs", tierId === t.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {moneyExact(t.pricePerHour)}/hr
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-foreground/80">Compare against</span>
            <div className="flex flex-wrap gap-2">
              {COMPETITOR_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={compId === id}
                  onClick={() => setCompId(id)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
                    compId === id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "border bg-background text-muted-foreground hover:bg-accent-hover"
                  )}
                >
                  {COMPETITORS[id].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-foreground p-8 text-background sm:p-10 lg:flex-[1.25]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-0 h-72 w-full opacity-25"
            style={{ background: "radial-gradient(60% 100% at 85% 0%, var(--color-primary) 0%, transparent 60%)" }}
          />
          <div className="relative z-10 flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Your total savings
            </span>
            <div className="flex flex-col gap-2">
              <p className="font-display text-6xl font-bold">
                <span className="text-emerald-400">
                  <AnimatedNumber value={savings} format={(n) => money(n)} />
                </span>
              </p>
              <p className="text-sm text-foreground/70">
                <span className="font-semibold text-emerald-400">{pct}% less</span> than{" "}
                {competitor.name} for an equivalent {tier.short.toLowerCase()} over {months} month
                {months > 1 ? "s" : ""}
              </p>
            </div>

            {/* Per-month bars */}
            <div className="mt-2 flex flex-col gap-3">
              <BarRow label="Marwat Tech" value={marwatMonthly} amount={money(marwatMonthly)} max={maxCompMonthly} highlight />
              {COMPETITOR_IDS.map((id) => (
                <BarRow
                  key={id}
                  label={COMPETITORS[id].name}
                  value={COMPETITORS[id].monthly}
                  amount={money(COMPETITORS[id].monthly)}
                  max={maxCompMonthly}
                  dim={id !== compId}
                  active={id === compId}
                  sub={id === compId ? `save ${money(savings)}` : undefined}
                />
              ))}
            </div>

            {/* Same-spend leverage */}
            <p className="flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300">
              <AppIcon name="userAdd" size={16} />
              {devs >= 1 ? `+${devs.toFixed(1)}` : "+0"} {tier.short.toLowerCase()} developer{devs >= 2 ? "s" : ""} for the same spend
            </p>

            <p className="border-t pt-4 text-xs text-foreground/60">
              Rates as of 2026 · {monthlyHours(hours)} hours/month · includes all costs, no hidden fees.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function BarRow({
  label,
  value,
  amount,
  max,
  highlight,
  dim,
  active,
  sub,
}: {
  label: string;
  value: number;
  amount: string;
  max: number;
  highlight?: boolean;
  dim?: boolean;
  active?: boolean;
  sub?: string;
}) {
  const width = Math.max(2, Math.round((value / max) * 100));
  return (
    <div className={cn("flex items-center gap-3 transition-opacity duration-300", dim && "opacity-55")}>
      <span className="w-24 shrink-0 text-sm font-semibold">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-foreground/15">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${width}%` }}
          viewport={{ once: true }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.7, ease: EASE }}
          className={cn("h-full rounded-full", (highlight || active) && "relative overflow-hidden")}
          style={{
            background: highlight
              ? "var(--color-primary)"
              : active
                ? "var(--color-gold)"
                : "color-mix(in srgb, currentColor 55%, transparent)",
          }}
        >
          {(highlight || active) && <div className="absolute inset-0 animate-pulse bg-white/10" />}
        </motion.div>
      </div>
      <span className="w-24 shrink-0 text-right text-sm font-medium">
        {amount}
        {sub && <span className="block text-xs font-medium text-emerald-400">{sub}</span>}
      </span>
    </div>
  );
}
