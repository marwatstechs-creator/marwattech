import type { Metadata } from "next";
import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { PricingTiers } from "@/components/marketing/pricing/pricing-tiers";
import { PricingComparison } from "@/components/marketing/pricing/pricing-comparison";
import { PricingCalculator } from "@/components/marketing/pricing/pricing-calculator";
import { PricingFaq } from "@/components/marketing/pricing/pricing-faq";
import { PricingSubscribe, type PlanCardData } from "@/components/marketing/pricing-subscribe";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import { moneyExact, DEV_TIERS, monthlyHours, monthlyCost } from "@/lib/pricing";
import { SITE } from "@/lib/constants";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Pricing — Vetted Developers from $4.99/hr | Marwat Tech",
    description:
      "Transparent hourly pricing for vetted developers across Associate, Mid-Senior and Senior levels — from $4.99/hr with no recruiter fees.",
    path: "/pricing",
  });
}

const OFFER = [
  {
    icon: "code" as const,
    title: "A dedicated, pre-vetted engineer",
    desc: "Sourced and matched to your stack — Next.js, React, WordPress, e-commerce, SEO, AI and more.",
  },
  {
    icon: "refresh" as const,
    title: "Free replacements, guaranteed",
    desc: "Not the right fit? Swap developers in or out, or we re-match you. No fees, ever.",
  },
  {
    icon: "eye" as const,
    title: "Radical transparency",
    desc: "Clear hourly billing with time tracking built in — you always know where your budget goes.",
  },
  {
    icon: "target" as const,
    title: "100% focus on your project",
    desc: "Your developer works on your stack and your goals — no shared teams or split attention.",
  },
  {
    icon: "chart" as const,
    title: "Guidance for non-technical founders",
    desc: "We help scope the build, draft the milestones and phase the work so you hire the right fit.",
  },
  {
    icon: "shield" as const,
    title: "No recruiter fees, no brand tax",
    desc: "The published rate is the rate you pay. Compare us against any agency or marketplace.",
  },
];

export default async function PricingPage() {
  let plans: PlanCardData[] = [];
  try {
    const db = await createClient();
    const { data } = await db
      .from("subscription_plans")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("amount", { ascending: true });
    plans = (data ?? []) as PlanCardData[];
  } catch {
    plans = [];
  }

  const baseline = monthlyCost(DEV_TIERS[0], 40); // $4.99/hr @ 40h/wk

  return (
    <>
      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Marwat Tech Vetted Remote Developers",
            description:
              "Transparent, pay-as-you-go pricing for vetted remote developers across associate, mid-senior and senior levels.",
            brand: { "@type": "Brand", name: SITE.name },
            url: "https://www.marwattech.com/pricing",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              offerCount: DEV_TIERS.length,
              lowPrice: String(DEV_TIERS[0].pricePerHour),
              highPrice: String(DEV_TIERS[DEV_TIERS.length - 1].pricePerHour),
              offers: DEV_TIERS.map((t) => ({
                "@type": "Offer",
                name: `${t.label} Developer`,
                priceCurrency: "USD",
                price: String(t.pricePerHour),
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: String(t.pricePerHour),
                  priceCurrency: "USD",
                  unitCode: "HUR",
                  unitText: "per hour",
                },
                availability: "https://schema.org/InStock",
                url: "https://www.marwattech.com/pricing",
              })),
            },
          }),
        }}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/70">
            <span className="size-2 rounded-[2px] bg-primary" />
            Transparent Pricing
          </span>
          <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Serious developers, <span className="text-primary">serious value.</span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Vetted engineers from <span className="font-semibold text-foreground">$4.99/hr</span>, billed by
            the hour and matched to your stack.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <p className="font-display text-5xl font-bold sm:text-6xl">
              <span className="align-top text-3xl text-primary">$</span>
              {moneyExact(DEV_TIERS[0].pricePerHour)}
              <span className="text-2xl font-normal text-muted-foreground">/hr</span>
            </p>
            <p className="text-sm font-medium text-muted-foreground">From · no recruiter fees</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <AppIcon name="check" size={15} className="text-primary" /> {monthlyHours(40)} hours ~ {moneyExact(baseline)}/month
            </span>
            <span className="flex items-center gap-2">
              <AppIcon name="check" size={15} className="text-primary" /> 500+ projects
            </span>
            <span className="flex items-center gap-2">
              <AppIcon name="check" size={15} className="text-primary" /> Matched in days
            </span>
          </div>

          <Link
            href="/contact"
            className="group inline-flex h-12 items-center gap-3 rounded-full bg-primary pl-6 pr-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Matched
            <span className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-black/10">
              <AppIcon name="arrowRight" size={18} className="transition-transform duration-300 group-hover:translate-x-[220%]" />
              <AppIcon name="arrowRight" size={18} className="absolute -translate-x-[220%] transition-transform duration-300 group-hover:translate-x-0" />
            </span>
          </Link>
        </div>
      </section>

      {/* ── The Offer ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="relative flex flex-col gap-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] opacity-90">
                <span className="size-2 rounded-[2px] bg-primary-foreground" />
                Everything you get
              </span>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Priced by the hour. Valued by the result.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {OFFER.map((o) => (
                <div
                  key={o.title}
                  className="flex flex-col gap-3 rounded-2xl bg-primary-foreground/10 p-5 backdrop-blur"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-primary-foreground/15">
                    <AppIcon name={o.icon} size={22} />
                  </span>
                  <p className="font-display font-semibold">{o.title}</p>
                  <p className="text-sm leading-relaxed opacity-90">{o.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tiers ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            <span className="size-2 rounded-[2px] bg-primary" />
            The Tiers
          </span>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Pick your tier.</h2>
        </div>
        <PricingTiers />
      </section>

      {/* ── Comparison ───────────────────────────────────────── */}
      <PricingComparison />

      {/* ── Calculator ───────────────────────────────────────── */}
      <PricingCalculator />

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <PricingFaq />

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl bg-foreground px-6 py-14 text-center text-background sm:px-12">
          <h2 className="font-display mx-auto max-w-lg text-3xl font-bold leading-tight sm:text-4xl">
            Vetted talent, <span className="text-muted-foreground">rapidly matched,</span>{" "}
            <span className="text-primary">radically priced.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-background/70">
            The best value for developers on the web.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Matched <AppIcon name="arrowRight" size={16} />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex h-12 items-center rounded-full border border-background/20 px-6 text-sm font-semibold transition-colors hover:bg-background/10"
            >
              See our work
            </Link>
          </div>
        </div>
      </section>

      {/* ── Managed plans & retainers (existing subscriptions) ── */}
      {plans.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Prefer a managed plan?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ongoing development, maintenance and support at a predictable monthly rate.
            </p>
          </div>
          <PricingSubscribe plans={plans} />
        </section>
      )}
    </>
  );
}
