import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { BlogCard } from "@/components/marketing/blog-card";
import { BlogFilters } from "@/components/marketing/blog-filters";
import { Pagination } from "@/components/marketing/pagination";
import { createClient } from "@/lib/supabase/server";
import { getPublishedPosts } from "@/lib/db/content";
import { DEMO_POSTS } from "@/lib/demo";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Insights, tutorials and guides on web development, SEO, ecommerce, hosting and AI from the Marwat Tech team.",
  path: "/blog",
});

type SearchParams = Promise<{ page?: string; q?: string; category?: string }>;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q;
  const category = params.category;

  let posts = DEMO_POSTS;
  let totalPages = 1;

  try {
    const db = await createClient();
    const result = await getPublishedPosts(db, {
      page,
      perPage: 9,
      search: q,
      categorySlug: category,
    });
    if (result.posts.length || q || category) {
      posts = result.posts.length ? result.posts : [];
      totalPages = result.totalPages;
    }
  } catch {
    // fallback to demo (pagination hidden)
  }

  return (
    <>
      <PageHero
        badge="Blog"
        title="Insights, tutorials & guides"
        description="Practical advice on web development, SEO, ecommerce and AI — from the people who build it every day."
        breadcrumbs={[{ label: "Blog" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <BlogFilters />
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center">
            <p className="text-muted-foreground">
              No articles found{q ? ` for “${q}”` : ""}. Try a different search
              or category.
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
          basePath="/blog"
          searchParams={{ q, category }}
        />
      </section>

      <CtaBanner />
    </>
  );
}
