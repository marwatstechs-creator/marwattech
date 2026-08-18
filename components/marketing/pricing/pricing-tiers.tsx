"use client";

import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
import {
  DEV_TIERS,
  monthlyCost,
  monthlyHours,
  moneyExact,
} from "@/lib/pricing";

const HOURS_PER_WEEK = 40; // baseline shown on the cards (160h/month)

export function PricingTiers() {
  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
      {DEV_TIERS.map((tier) => {
        const monthly = monthlyCost(tier, HOURS_PER_WEEK);
        const featured = tier.popular;
        return (
          <article
            key={tier.id}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-3xl border bg-card",
              featured
                ? "border-primary shadow-xl shadow-primary/10 lg:-my-3"
                : "border-border"
            )}
          >
            {featured && (
              <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Most Popular
              </span>
            )}
            <div
              className={cn(
                "flex flex-col gap-5 p-7",
                featured ? "bg-primary/5" : "border-b"
              )}
            >
              <div className="flex min-h-[52px] flex-col gap-1">
                <h3 className="font-display text-lg font-bold leading-snug">{tier.label}</h3>
                <p className="text-sm text-muted-foreground">{tier.tagline}</p>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-display text-4xl font-bold">
                  {moneyExact(tier.pricePerHour)}
                </span>
                <span className="pb-1 text-sm font-medium text-muted-foreground">/ hour</span>
              </div>
              <p className="text-sm font-semibold text-primary">
                {monthlyHours(HOURS_PER_WEEK)} hours ~ {moneyExact(monthly)}/month
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-7 p-7">
              <ul className="flex flex-col gap-4">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <AppIcon name="check" size={14} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className={cn(
                  "mt-auto inline-flex items-center justify-between rounded-full py-2.5 pl-6 pr-2.5 font-display text-sm font-semibold transition-colors",
                  featured
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border bg-background hover:bg-accent-hover"
                )}
              >
                Get Started
                <span className="grid size-9 place-items-center rounded-full bg-black/10 text-current">
                  <AppIcon name="arrowRight" size={18} />
                </span>
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
