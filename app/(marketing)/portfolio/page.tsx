import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { PortfolioGrid } from "@/components/marketing/portfolio-grid";
import { PortfolioFilter } from "@/components/marketing/portfolio-filter";
import { createClient } from "@/lib/supabase/server";
import { getPublishedPortfolio } from "@/lib/db/content";
import { DEMO_PROJECTS } from "@/lib/demo";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
  title: "Portfolio",
  description:
    "Browse recent web design, web development, graphic design, social media and SEO projects by Marwat Tech.",
  path: "/portfolio",
  });
}

export default async function PortfolioPage() {
  let projects = DEMO_PROJECTS;
  try {
    const db = await createClient();
    const data = await getPublishedPortfolio(db);
    projects = data.length ? data : DEMO_PROJECTS;
  } catch {
    // fallback
  }

  return (
    <>
      <PageHero
        badge="Portfolio"
        title="Work that speaks for itself"
        description="Explore a selection of websites, apps and brands we’ve designed and developed for clients around the world."
        breadcrumbs={[{ label: "Portfolio" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <PortfolioFilter />
        <PortfolioGrid projects={projects} />
      </section>

      <CtaBanner />
    </>
  );
}
