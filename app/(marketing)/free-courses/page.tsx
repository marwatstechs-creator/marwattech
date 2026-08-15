import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { DealNotice } from "@/components/marketing/deal-notice";
import { PromoHowItWorks } from "@/components/marketing/promo-how-it-works";
import { FreeCoursesEmpty } from "@/components/marketing/free-courses-empty";
import { CourseUpdateSubscribe } from "@/components/marketing/course-update-subscribe";
import { AdUnit } from "@/components/adsense/ad-unit";
import { StickyAd } from "@/components/adsense/sticky-ad";
import { SidebarAd } from "@/components/adsense/sidebar-ad";
import { PromoCodeCard, type PromoCodeCardData } from "@/components/marketing/promo-code-card";
import { createClient } from "@/lib/supabase/server";
import {
  getEnabledPromoCodes,
  getEnabledAds,
  getSiteSettings,
  type PromoCode,
  type EnabledAd,
} from "@/lib/db/content";
import { syncUdemyDeals } from "@/lib/promo/sync-udemy-deals";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

// Fully dynamic — always renders fresh from the DB so a stale cached "empty"
// page can never be served (the Udemy feed is DB-backed and refreshed when stale).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
  title: "Free Courses",
  description:
    "100% free online courses — grab a free coupon code before it expires. Hand-picked free courses and deals from Udemy and other platforms.",
  path: "/free-courses",
  image: `${SITE.url}/og-free-courses.png`,
  });
}

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
  let ads: EnabledAd[] = [];

  try {
    const db = await createClient();
    const [manual, settings, enabledAds] = await Promise.all([
      getEnabledPromoCodes(db, { source: "manual" }),
      getSiteSettings(db),
      getEnabledAds(db),
    ]);
    ads = enabledAds;

    // 1) Manually-added full-paid (100% off) codes — filter tag in JS so the
    //    source-only query (proven on /promo-codes) is used consistently.
    items = manual.filter((c) => c.tag === "full_paid").map(toCard);

    // 2) Auto Udemy feed — only 100% free courses. DB-backed so GitHub
    //    outages never blank the page; auto-refresh when stale or empty.
    if (settings.promo_udemy_feed !== "0") {
      let auto = await getEnabledPromoCodes(db, { source: "auto_udemy" });
      const stale =
        auto.length === 0 ||
        Date.now() - new Date(auto[0].created_at).getTime() > 6 * 3600 * 1000;
      if (stale) {
        const res = await syncUdemyDeals(db);
        if (res.ok) {
          auto = await getEnabledPromoCodes(db, { source: "auto_udemy" });
        }
      }
      items = [...items, ...auto.filter((c) => c.tag === "full_paid").map(toCard)];
    }
  } catch {
    // fallback — empty
  }

  const inContentAds = ads.filter((a) => a.placement === "in_content");
  const stickyAds = ads.filter((a) => a.placement === "sticky");
  const sidebarAds = ads.filter((a) => a.placement === "sidebar");
  const topAd = inContentAds[0];
  const midAd = inContentAds[1];
  const bottomAd = inContentAds[2];

  return (
    <>
      <PageHero
        badge="Free Courses"
        title="Free Courses"
        description="100% free courses — no payment needed. Copy a code and start learning today, before it expires."
        breadcrumbs={[{ label: "Free Courses" }]}
      />

      <DealNotice />

      {topAd && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdUnit
            adClient={topAd.ad_client}
            slotId={topAd.slot_id}
            format={topAd.format}
            className="rounded-2xl border bg-card/60 py-4"
          />
        </div>
      )}

      <section
        data-sidebar-start
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        {items.length === 0 ? (
          <FreeCoursesEmpty />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <PromoCodeCard code={c} key={c.id} />
            ))}
          </div>
        )}

        {midAd && (
          <div className="mt-10">
            <AdUnit
              adClient={midAd.ad_client}
              slotId={midAd.slot_id}
              format={midAd.format}
              className="rounded-2xl border bg-card/60 py-4"
            />
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Free-course codes come from a public community feed and expire quickly —
          redeem them early.
        </p>

        <div className="mt-10">
          <CourseUpdateSubscribe />
        </div>

        <PromoHowItWorks />
      </section>

      {bottomAd && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdUnit
            adClient={bottomAd.ad_client}
            slotId={bottomAd.slot_id}
            format={bottomAd.format}
            className="rounded-2xl border bg-card/60 py-4"
          />
        </div>
      )}

      <CtaBanner />

      {sidebarAds[0] && <SidebarAd ad={sidebarAds[0]} side="right" />}
      {sidebarAds[1] && <SidebarAd ad={sidebarAds[1]} side="left" />}
      {stickyAds[0] && <StickyAd ad={stickyAds[0]} />}
    </>
  );
}
