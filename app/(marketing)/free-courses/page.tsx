import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { DealNotice } from "@/components/marketing/deal-notice";
import { PromoHowItWorks } from "@/components/marketing/promo-how-it-works";
import { AppIcon } from "@/components/app-icon";
import { PromoCodeCard, type PromoCodeCardData } from "@/components/marketing/promo-code-card";
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
  title: "Free Courses",
  description:
    "100% free online courses — grab a free coupon code before it expires. Hand-picked free courses and deals from Udemy and other platforms.",
  path: "/free-courses",
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

export default async function FreeCoursesPage() {
  let items: PromoCodeCardData[] = [];

  try {
    const db = await createClient();
    const [manual, settings] = await Promise.all([
      getEnabledPromoCodes(db, { source: "manual", tag: "full_paid" }),
      getSiteSettings(db),
    ]);

    // 1) Manually-added full-paid (100% off) codes
    items = manual.map(toCard);

    // 2) Auto Udemy feed — only 100% free courses
    if (settings.promo_udemy_feed !== "0") {
      const deals = await fetchUdemyDeals(300);
      const free = deals.filter((d) => d.discount === 100);
      items = [
        ...items,
        ...free.map((d, i) => ({
          id: `udemy-free-${i}`,
          title: d.title,
          store: "Udemy",
          code: d.code ?? "—",
          discount_label: "100% OFF",
          url: d.url,
          image_url: d.image,
          category: d.category,
          expiry: d.expiry,
        })),
      ];
    }
  } catch {
    // fallback — empty
  }

  return (
    <>
      <PageHero
        badge="Free Courses"
        title="Free Courses"
        description="100% free courses — no payment needed. Copy a code and start learning today, before it expires."
        breadcrumbs={[{ label: "Free Courses" }]}
      />

      <DealNotice />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center">
            <AppIcon name="star" size={40} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No free courses right now</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Free deals change daily — check back soon for new 100% off codes.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <PromoCodeCard key={c.id} code={c} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Free-course codes come from a public community feed and expire quickly —
          redeem them early.
        </p>

        <PromoHowItWorks />
      </section>

      <CtaBanner />
    </>
  );
}
