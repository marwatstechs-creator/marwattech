import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { PortfolioGrid } from "@/components/marketing/portfolio-grid";
import { PortfolioFilter } from "@/components/marketing/portfolio-filter";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  getPublishedPortfolio,
  getPortfolioItemBySlug,
  type ProjectWithCategory,
} from "@/lib/db/content";
import { DEMO_PROJECTS } from "@/lib/demo";
import { PORTFOLIO_CATEGORIES } from "@/lib/constants";
import { sanitizeHtml } from "@/lib/sanitize";
import { buildMetadata } from "@/lib/seo";
import { creativeWorkJsonLd } from "@/lib/seo-jsonld";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [
    ...PORTFOLIO_CATEGORIES.filter((c) => c.slug !== "all").map((c) => ({
      slug: c.slug,
    })),
    ...DEMO_PROJECTS.map((p) => ({ slug: p.slug })),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const isCategory = PORTFOLIO_CATEGORIES.some((c) => c.slug === slug);
  if (isCategory) {
    const label = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug)?.label;
    return buildMetadata({
      title: `${label} Portfolio`,
      description: `Browse our ${label?.toLowerCase()} projects and case studies.`,
      path: `/portfolio/${slug}`,
    });
  }

  let project = DEMO_PROJECTS.find((p) => p.slug === slug) ?? null;
  try {
    const db = await createClient();
    project = (await getPortfolioItemBySlug(db, slug)) ?? project;
  } catch {
    // fallback
  }
  if (!project) return {};
  return buildMetadata({
    title: project.meta_title ?? project.title,
    description: project.meta_description ?? project.summary ?? "",
    path: `/portfolio/${project.slug}`,
    image: project.og_image ?? project.cover_image,
  });
}

export default async function PortfolioSlugPage({ params }: Props) {
  const { slug } = await params;

  const isCategory = PORTFOLIO_CATEGORIES.some((c) => c.slug === slug);

  // ── Category listing route (matches sitemap) ─────────────────────
  if (isCategory) {
    const label = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug)?.label;
    let projects = DEMO_PROJECTS;
    try {
      const db = await createClient();
      const data = await getPublishedPortfolio(db, slug);
      projects = data.length ? data : DEMO_PROJECTS;
    } catch {
      // fallback
    }

    return (
      <>
        <PageHero
          badge="Portfolio"
          title={`${label} Projects`}
          description={`Hand-picked ${label?.toLowerCase()} work from our portfolio.`}
          breadcrumbs={[
            { label: "Portfolio", href: "/portfolio" },
            { label: label ?? slug },
          ]}
        />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <PortfolioFilter />
          <PortfolioGrid projects={projects} />
        </section>
        <CtaBanner />
      </>
    );
  }

  // ── Project detail route ─────────────────────────────────────────
  let project: ProjectWithCategory | null =
    DEMO_PROJECTS.find((p) => p.slug === slug) ?? null;
  try {
    const db = await createClient();
    project = (await getPortfolioItemBySlug(db, slug)) ?? project;
  } catch {
    // fallback
  }

  if (!project) notFound();

  const technologies = (project.technologies as string[] | null) ?? [];
  const images = (project.images as { url: string; alt?: string }[] | null) ?? [];
  const content = project.content ? sanitizeHtml(project.content) : "";

  return (
    <>
      <JsonLd
        data={creativeWorkJsonLd({
          name: project.title,
          description: project.summary,
          path: `/portfolio/${project.slug}`,
          image: project.cover_image ?? images[0]?.url ?? null,
          datePublished: project.published_at,
          dateModified: project.updated_at,
        })}
      />
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Portfolio", href: "/portfolio" },
              { label: project.portfolio_categories?.name ?? "Projects" },
              { label: project.title },
            ]}
          />
          <div className="grid items-end gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <Badge variant="gold" className="mb-4">
                {project.portfolio_categories?.name ?? "Web Project"}
              </Badge>
              <h1 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
                {project.title}
              </h1>
              {project.summary && (
                <p className="mt-4 max-w-2xl text-muted-foreground">
                  {project.summary}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {project.client_name && (
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium">{project.client_name}</p>
                </div>
              )}
              {project.industry && (
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="font-medium">{project.industry}</p>
                </div>
              )}
              {project.project_url && (
                <div>
                  <p className="text-xs text-muted-foreground">Live site</p>
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Visit <AppIcon name="external" size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cover */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {project.cover_image ? (
          <Image
            src={project.cover_image}
            alt={project.title}
            width={1600}
            height={900}
            className="aspect-[16/8] w-full rounded-2xl border object-cover"
          />
        ) : (
          <div className="grid aspect-[16/8] w-full place-items-center rounded-2xl border bg-gradient-to-br from-primary/15 via-gold/10 to-azure/15">
            <AppIcon name="layers" size={56} className="text-primary/40" />
          </div>
        )}
      </section>

      {/* Detail */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          {content && (
            <div
              className="prose-cms"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
          <aside className="space-y-6">
            {technologies.length > 0 && (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="font-display mb-4 text-lg font-bold">
                  Technologies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {technologies.map((t) => (
                    <Badge key={t} variant="outline" className="py-1">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-xl border bg-primary p-6 text-primary-foreground">
              <h2 className="font-display mb-2 text-lg font-bold">
                Like what you see?
              </h2>
              <p className="mb-4 text-sm text-primary-foreground/85">
                Let’s build something similar for your business.
              </p>
              <Link href="/free-mockup">
                <Button variant="gold" className="w-full">
                  Get a free mockup
                  <AppIcon name="arrowUpRight" size={16} />
                </Button>
              </Link>
            </div>
          </aside>
        </div>

        {/* Gallery */}
        {images.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, i) => (
              <Image
                key={i}
                src={img.url}
                alt={img.alt ?? `${project.title} screenshot ${i + 1}`}
                width={800}
                height={600}
                className="aspect-[4/3] w-full rounded-xl border object-cover"
              />
            ))}
          </div>
        )}
      </section>

      <CtaBanner />
    </>
  );
}
