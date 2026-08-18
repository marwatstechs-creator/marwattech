"use client";

import { useMemo, useState } from "react";

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
          <span className="font-display text-3xl font-bold">{value}</span>
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

export function PricingCalculator() {
  const [hours, setHours] = useState(40);
  const [months, setMonths] = useState(6);
  const [tierId, setTierId] = useState<DevTierId>("senior");
  const [compId, setCompId] = useState<CompetitorId>("toptal");

  const tier = DEV_TIERS.find((t) => t.id === tierId)!;
  const competitor = COMPETITORS[compId];

  const { marwatMonthly, marwatTotal, compTotal, savings, pct } = useMemo(() => {
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
    };
  }, [tier, competitor, hours, months]);

  const maxCompMonthly = Math.max(...COMPETITOR_IDS.map((id) => COMPETITORS[id].monthly));

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          <span className="size-2 rounded-[2px] bg-primary" />
          Calculate Your Savings
        </span>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          Don&apos;t overpay <span className="text-muted-foreground">for the logo.</span>
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          Pay for the talent, not the brand tax. Move the sliders and see the difference.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card lg:flex">
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
                    "flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-sm transition-colors",
                    tierId === t.id
                      ? "bg-primary text-primary-foreground"
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
                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    compId === id
                      ? "bg-primary text-primary-foreground"
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
        <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-foreground p-8 text-background sm:p-10 lg:flex-[1.2]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-0 h-72 w-full opacity-25"
            style={{ background: "radial-gradient(60% 100% at 85% 0%, var(--color-primary) 0%, transparent 60%)" }}
          />
          <div className="relative z-10 flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Your total cost
            </span>
            <div className="flex flex-col gap-2">
              <p className="font-display text-6xl font-bold">
                <span className="text-emerald-400">{money(marwatTotal)}</span>
              </p>
              <p className="text-sm text-foreground/70">
                <span className="font-semibold text-emerald-400">{pct}% less</span> than{" "}
                {competitor.name} for an equivalent {tier.short.toLowerCase()} over {months} month
                {months > 1 ? "s" : ""}
              </p>
            </div>

            {/* Bars */}
            <div className="mt-2 flex flex-col gap-4">
              <BarRow label="Marwat Tech" value={marwatMonthly} amount={money(marwatMonthly)} max={maxCompMonthly} color="var(--color-primary)" active />
              <BarRow
                label={competitor.name}
                value={competitor.monthly}
                amount={money(competitor.monthly)}
                max={maxCompMonthly}
                color="var(--color-primary)"
                dim
                sub={`save ${money(savings)}`}
              />
            </div>

            <p className="border-t pt-4 text-xs text-foreground/60">
              Rates as of 2026 · {monthlyHours(hours)} hours/month · includes all costs, no hidden fees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BarRow({
  label,
  value,
  amount,
  max,
  color,
  active,
  dim,
  sub,
}: {
  label: string;
  value: number;
  amount: string;
  max: number;
  color: string;
  active?: boolean;
  dim?: boolean;
  sub?: string;
}) {
  const width = Math.max(2, Math.round((value / max) * 100));
  return (
    <div className={cn("flex items-center gap-3", dim && "opacity-80")}>
      <span className="w-24 shrink-0 text-sm font-semibold">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-foreground/15">
        <div
          className={cn("h-full rounded-full", active && "relative overflow-hidden")}
          style={{ width: `${width}%`, background: active ? color : "color-mix(in srgb, currentColor 60%, transparent)" }}
        >
          {active && <div className="absolute inset-0 animate-pulse bg-white/10" />}
        </div>
      </div>
      <span className="w-24 shrink-0 text-right text-sm font-medium">
        {amount}
        {sub && <span className="block text-xs font-medium text-emerald-400">{sub}</span>}
      </span>
    </div>
  );
}
