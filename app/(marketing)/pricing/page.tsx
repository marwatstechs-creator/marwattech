import type { Metadata } from "next";

import { PricingHero } from "@/components/marketing/pricing/pricing-hero";
import { PricingOffer } from "@/components/marketing/pricing/pricing-offer";
import { PricingTiers } from "@/components/marketing/pricing/pricing-tiers";
import { PricingComparison } from "@/components/marketing/pricing/pricing-comparison";
import { PricingCalculator } from "@/components/marketing/pricing/pricing-calculator";
import { PricingFaq } from "@/components/marketing/pricing/pricing-faq";
import { PricingCta } from "@/components/marketing/pricing/pricing-cta";
import { PricingSubscribe, type PlanCardData } from "@/components/marketing/pricing-subscribe";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import { DEV_TIERS } from "@/lib/pricing";
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
      <PricingHero />

      {/* ── The Offer ────────────────────────────────────────── */}
      <PricingOffer />

      {/* ── Tiers ────────────────────────────────────────────── */}
      <PricingTiers />

      {/* ── Comparison ───────────────────────────────────────── */}
      <PricingComparison />

      {/* ── Calculator ───────────────────────────────────────── */}
      <PricingCalculator />

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <PricingFaq />

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <PricingCta />

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
