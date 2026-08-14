import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { BlogCard } from "@/components/marketing/blog-card";
import { BlogFilters } from "@/components/marketing/blog-filters";
import { Pagination } from "@/components/marketing/pagination";
import { createClient } from "@/lib/supabase/server";
import { getPublishedPosts, getEnabledAds } from "@/lib/db/content";
import type { EnabledAd } from "@/lib/db/content";
import { AdUnit } from "@/components/adsense/ad-unit";
import { DEMO_POSTS as ALL_DEMO_POSTS } from "@/lib/demo";
import { BLOG_CATEGORIES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
};

export async function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const label = BLOG_CATEGORIES.find((c) => c.slug === slug)?.label;
  if (!label) return {};
  return buildMetadata({
    title: `${label} — Blog`,
    description: `Articles about ${label.toLowerCase()} from the Marwat Tech blog.`,
    path: `/blog/category/${slug}`,
  });
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const label = BLOG_CATEGORIES.find((c) => c.slug === slug)?.label;
  if (!label) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q;

  // Map category slug → demo posts for fallback rendering
  const demoByCategory: Record<string, typeof ALL_DEMO_POSTS> = {
    "web-design-development": ALL_DEMO_POSTS.slice(0, 2),
    "seo-marketing": ALL_DEMO_POSTS.slice(1, 3),
    "domain-hosting": ALL_DEMO_POSTS.slice(2, 3),
    "ai-future-tech": ALL_DEMO_POSTS.slice(3, 4),
  };

  let posts = demoByCategory[slug] ?? [];
  let totalPages = 1;
  let ads: EnabledAd[] = [];

  try {
    const db = await createClient();
    const result = await getPublishedPosts(db, {
      page,
      perPage: 9,
      categorySlug: slug,
      search: q,
    });
    posts = result.posts;
    totalPages = result.totalPages;
    ads = await getEnabledAds(db, "listing");
  } catch {
    // fallback
  }

  return (
    <>
      <PageHero
        badge="Blog"
        title={`${label} Articles`}
        description={`Latest posts in the ${label.toLowerCase()} category.`}
        breadcrumbs={[
          { label: "Blog", href: "/blog" },
          { label: label },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <BlogFilters />
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center">
            <p className="text-muted-foreground">
              No articles in this category yet — check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/blog/category/${slug}`}
          searchParams={{ q }}
        />
      </section>

      {/* Listing ad */}
      {ads[0] && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <AdUnit
            adClient={ads[0].ad_client}
            slotId={ads[0].slot_id}
            format={ads[0].format}
            className="rounded-2xl border bg-card/60 py-4"
          />
        </section>
      )}

      <CtaBanner />
    </>
  );
}
