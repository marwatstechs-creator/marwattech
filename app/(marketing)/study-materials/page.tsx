import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { AppIcon } from "@/components/app-icon";
import { AdSlot } from "@/components/adsense/ad-slot";
import { StickyAd } from "@/components/adsense/sticky-ad";
import { SidebarAd } from "@/components/adsense/sidebar-ad";
import { StudyCatalog } from "@/components/marketing/study-catalog";
import { createClient } from "@/lib/supabase/server";
import {
  getPublishedStudyMaterials,
  getEnabledAds,
  type PublicStudyMaterial,
  type EnabledAd,
} from "@/lib/db/content";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
  title: "Study Materials",
  description:
    "Free downloadable resources, guides, templates and study material from Marwat Tech — web development, SEO, ecommerce, design and AI.",
  path: "/study-materials",
  });
}

export default async function StudyMaterialsPage() {
  let materials: PublicStudyMaterial[] = [];
  let ads: EnabledAd[] = [];

  try {
    const db = await createClient();
    const [m, a] = await Promise.all([
      getPublishedStudyMaterials(db),
      getEnabledAds(db),
    ]);
    materials = m;
    ads = a;
  } catch {
    // fallback to empty
  }

  const stickyAds = ads.filter((x) => x.placement === "sticky");
  const sidebarAds = ads.filter((x) => x.placement === "sidebar");

  return (
    <>
      <PageHero
        badge="Resources"
        title="Study Materials"
        description="Free guides, templates and downloadable resources to help you learn and grow online."
        breadcrumbs={[{ label: "Study Materials" }]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/study"
          className="group flex flex-col gap-2 rounded-2xl border bg-card p-5 transition hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <AppIcon name="folder" size={22} />
            </span>
            <div>
              <p className="font-display font-semibold group-hover:text-primary">Study Platform</p>
              <p className="text-sm text-muted-foreground">
                Structured subjects, weekly lessons and slide decks with progress tracking.
              </p>
            </div>
          </div>
          <span className="text-sm font-medium text-primary">
            Open platform <AppIcon name="chevronRight" size={16} className="ml-1 inline" />
          </span>
        </Link>
      </div>

      <section
        data-sidebar-start
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <AdSlot area="study-top" className="mb-10 rounded-2xl border bg-card/60 py-4" />

        <StudyCatalog kind="materials" materials={materials} />

        <AdSlot area="study-between" className="mt-10 rounded-2xl border bg-card/60 py-4" />
      </section>

      <CtaBanner />

      {sidebarAds[0] && <SidebarAd ad={sidebarAds[0]} side="right" />}
      {sidebarAds[1] && <SidebarAd ad={sidebarAds[1]} side="left" />}
      {stickyAds[0] && <StickyAd ad={stickyAds[0]} />}
    </>
  );
}
