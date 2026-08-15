import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export type LegalSection = {
  heading: string;
  body: string[];
};

export async function legalMetadata(
  title: string,
  description: string,
  path: string
): Promise<Metadata> {
  return buildMetadata({
    title,
    description,
    path,
    noindex: true,
  });
}

export function LegalPage({
  title,
  description,
  lastUpdated,
  sections,
}: {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero
        title={title}
        description={description}
        breadcrumbs={[{ label: title }]}
      />

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="mb-10 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Last updated: {formatDate(lastUpdated)}
        </p>

        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-display mb-3 text-2xl font-bold">
                {section.heading}
              </h2>
              {section.body.map((paragraph, i) => (
                <p
                  key={i}
                  className="mb-3 leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
