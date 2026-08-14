import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdUnit } from "@/components/adsense/ad-unit";
import { createClient } from "@/lib/supabase/server";
import {
  getPublishedStudyMaterials,
  getEnabledAds,
  type PublicStudyMaterial,
  type EnabledAd,
} from "@/lib/db/content";
import { buildMetadata } from "@/lib/seo";
import { formatBytes, formatDate } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Study Materials",
  description:
    "Free downloadable resources, guides, templates and study material from Marwat Tech — web development, SEO, ecommerce, design and AI.",
  path: "/study-materials",
});

const FILE_ICONS: Record<string, string> = {
  pdf: "document",
  doc: "document",
  docx: "document",
  zip: "box",
  pptx: "chart",
  xlsx: "table",
};

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

  const listingAds = ads.filter((x) => x.placement === "listing");
  const inContentAds = ads.filter((x) => x.placement === "in_content");
  const topAd = listingAds[0] ?? inContentAds[0];
  const bottomAd = inContentAds[1] ?? listingAds[1];

  return (
    <>
      <PageHero
        badge="Resources"
        title="Study Materials"
        description="Free guides, templates and downloadable resources to help you learn and grow online."
        breadcrumbs={[{ label: "Study Materials" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {topAd && (
          <AdUnit
            adClient={topAd.ad_client}
            slotId={topAd.slot_id}
            format={topAd.format}
            className="mb-10 rounded-2xl border bg-card/60 py-4"
          />
        )}

        {materials.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center">
            <AppIcon name="folder" size={40} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No study materials yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              We&apos;re preparing free guides and resources. Check back soon — or
              ask us for a topic you&apos;d like covered.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <Card key={m.id} className="card-3d flex flex-col overflow-hidden">
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <AppIcon
                        name={FILE_ICONS[m.file_type ?? ""] ?? "document"}
                        size={22}
                      />
                    </span>
                    {m.category && (
                      <Badge variant="gold">{m.category}</Badge>
                    )}
                  </div>
                  <h2 className="font-display mt-4 text-lg font-bold leading-snug">
                    {m.title}
                  </h2>
                  {m.description && (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                      {m.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border px-2.5 py-0.5 font-medium uppercase">
                      {m.file_type?.toUpperCase() ?? "FILE"}
                    </span>
                    {m.file_size != null && <span>{formatBytes(m.file_size)}</span>}
                    <span>· {formatDate(m.created_at)}</span>
                  </div>
                  <Button asChild className="mt-4 w-full">
                    <a href={m.file_url} target="_blank" rel="noreferrer">
                      <AppIcon name="download" size={16} />
                      Download
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {bottomAd && (
          <AdUnit
            adClient={bottomAd.ad_client}
            slotId={bottomAd.slot_id}
            format={bottomAd.format}
            className="mt-10 rounded-2xl border bg-card/60 py-4"
          />
        )}
      </section>

      <CtaBanner />
    </>
  );
}
