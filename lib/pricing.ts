/**
 * Marwat Tech developer-pricing data.
 *
 * Hourly rates are 50% of the reference marketplace's published rates:
 *   Associate  $9.99  → $4.99/hr
 *   Mid-Senior $21.99 → $10.99/hr
 *   Senior     $30.99 → $15.49/hr
 *
 * Kept in one place so the tier cards, comparison table and the savings
 * calculator always agree.
 */

export type DevTierId = "associate" | "mid" | "senior";

export type DevTier = {
  id: DevTierId;
  short: string;
  label: string;
  tagline: string;
  pricePerHour: number;
  /** "Most popular" / highlighted tier. */
  popular?: boolean;
  features: string[];
};

export const DEV_TIERS: DevTier[] = [
  {
    id: "associate",
    short: "Associate",
    label: "Associate Level Developer",
    tagline: "Best for simple tasks, quick fixes and early-stage builds.",
    pricePerHour: 4.99,
    features: ["Versatile Development", "MVP Builds", "Bug Fixes & Small Tasks"],
  },
  {
    id: "mid",
    short: "Mid-Senior",
    label: "Mid-Senior Level Developer",
    tagline: "Best for most projects and growing teams.",
    pricePerHour: 10.99,
    popular: true,
    features: ["Team Lead Capability", "Architecture & Problem Solving", "Full-Stack Delivery"],
  },
  {
    id: "senior",
    short: "Senior",
    label: "Senior Level Developer",
    tagline: "Best for complex technical leadership and architecture.",
    pricePerHour: 15.49,
    features: ["Fractional CTO Capability", "Architectural Guidance", "Code Review & Mentoring"],
  },
];

export const DEV_TIER_BY_ID: Record<DevTierId, DevTier> = Object.fromEntries(
  DEV_TIERS.map((t) => [t.id, t])
) as Record<DevTierId, DevTier>;

/** Monthly hours at a given hours-per-week (4 weeks / month, ~160h at 40h/wk). */
export function monthlyHours(hoursPerWeek: number): number {
  return Math.round(hoursPerWeek * 4);
}

/** Monthly cost for a tier at a given hours-per-week. */
export function monthlyCost(tier: DevTier, hoursPerWeek: number): number {
  return tier.pricePerHour * monthlyHours(hoursPerWeek);
}

/** Competitors used by the savings calculator (monthly rates). */
export type CompetitorId = "toptal" | "upwork" | "fiverr" | "arc";

export const COMPETITORS: Record<
  CompetitorId,
  { name: string; monthly: number }
> = {
  toptal: { name: "Toptal", monthly: 17600 },
  upwork: { name: "Upwork", monthly: 15551 },
  fiverr: { name: "Fiverr", monthly: 16880 },
  arc: { name: "Arc", monthly: 18240 },
};

export const COMPETITOR_IDS = Object.keys(COMPETITORS) as CompetitorId[];

export const money = (n: number): string =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export const moneyExact = (n: number): string =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
