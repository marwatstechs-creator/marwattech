import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { DealNotice } from "@/components/marketing/deal-notice";
import { PromoHowItWorks } from "@/components/marketing/promo-how-it-works";
import { PromoCodesClient } from "@/components/marketing/promo-codes-client";
import type { PromoCodeCardData } from "@/components/marketing/promo-code-card";
import { createClient } from "@/lib/supabase/server";
import {
  getEnabledPromoCodes,
  getSiteSettings,
  type PromoCode,
} from "@/lib/db/content";
import { fetchUdemyDeals } from "@/lib/promo/udemy-feed";
import { buildMetadata } from "@/lib/seo";

// Refresh every hour so the auto Udemy feed stays fresh and a transient
// fetch failure never leaves the page empty for long.
export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Promo Codes & Deals",
  description:
    "Fresh promo codes and discounts — latest offers, full-paid 100% off deals and more from Udemy and other learning platforms.",
  path: "/promo-codes",
});

function toCard(c: PromoCode): PromoCodeCardData {
  return {
    id: c.id,
    title: c.title,
    store: c.store,
    code: c.code,
    discount_label: c.discount_label,
    url: c.url,
    image_url: c.image_url,
    category: c.category,
    expiry: c.expires_at ? c.expires_at.slice(0, 10) : null,
  };
}

export default async function PromoCodesPage() {
  let latest: PromoCodeCardData[] = [];
  let fullPaid: PromoCodeCardData[] = [];
  let other: PromoCodeCardData[] = [];
  let udemy: PromoCodeCardData[] = [];
  let udemyEnabled = true;

  try {
    const db = await createClient();
    const [all, settings] = await Promise.all([
      getEnabledPromoCodes(db, { source: "manual" }),
      getSiteSettings(db),
    ]);

    udemyEnabled = settings.promo_udemy_feed !== "0";

    latest = all.filter((c) => c.tag === "latest").map(toCard);
    fullPaid = all.filter((c) => c.tag === "full_paid").map(toCard);
    other = all.filter((c) => c.tag === "other").map(toCard);

    if (udemyEnabled) {
      const deals = await fetchUdemyDeals(60);
      udemy = deals.map((d, i) => ({
        id: `udemy-${i}`,
        title: d.title,
        store: "Udemy",
        code: d.code ?? "—",
        discount_label: d.discount != null ? `${d.discount}% OFF` : null,
        url: d.url,
        image_url: d.image,
        category: d.category,
        expiry: d.expiry,
      }));
    }
  } catch {
    // fallback — empty sections
  }

  return (
    <>
      <PageHero
        badge="Deals"
        title="Promo Codes & Deals"
        description="Latest promo codes, full-paid 100% off offers and discounted learning deals — grab them before they expire."
        breadcrumbs={[{ label: "Promo Codes" }]}
      />

      <DealNotice />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <PromoCodesClient
          latest={latest}
          fullPaid={fullPaid}
          other={other}
          udemy={udemy}
          udemyEnabled={udemyEnabled}
        />

        <PromoHowItWorks />
      </section>

      <CtaBanner />
    </>
  );
}
