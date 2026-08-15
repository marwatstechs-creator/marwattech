import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { PricingSubscribe, type PlanCardData } from "@/components/marketing/pricing-subscribe";
import { AppIcon } from "@/components/app-icon";
import { createClient } from "@/lib/supabase/server";
import { resolvePaypalConfig } from "@/lib/payments/paypal";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
  title: "Pricing & Subscriptions",
  description:
    "Flexible plans and retainers from Marwat Tech — ongoing development, support and growth at a predictable monthly or yearly rate.",
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
  const cfg = await resolvePaypalConfig();

  return (
    <>
      <PageHero
        badge="Subscriptions"
        title="Predictable pricing, ongoing growth"
        description="Choose a monthly or yearly plan and we'll handle your development, maintenance and support as an extension of your team."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Pricing" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {plans.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-dashed bg-muted/30 p-12 text-center">
            <span className="icon-3d-tile mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <AppIcon name="sparkles" size={26} />
            </span>
            <h2 className="font-display mt-4 text-xl font-bold">Plans are being prepared</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our subscription plans are coming soon. Meanwhile, reach out and
              we&apos;ll tailor a plan for your needs.
            </p>
            <Link href="/contact" className="mt-5 inline-flex">
              <span className="btn-3d-gold inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold">
                Get a custom quote
              </span>
            </Link>
          </div>
        ) : (
          <>
            <PricingSubscribe plans={plans} />
            {!cfg.enabled && (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Online sign-up is being activated — plans will be live shortly.
              </p>
            )}
          </>
        )}
      </section>

      <CtaBanner />
    </>
  );
}
