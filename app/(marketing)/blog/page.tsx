import type { Metadata } from "next";

import { BlogPageClient } from "@/components/marketing/blog-page-client";
import type { BlogPostCard } from "@/components/marketing/blog-card-v2";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { createClient } from "@/lib/supabase/server";
import { getPublishedPosts, getBlogCategories } from "@/lib/db/content";
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

const FALLBACK_CATEGORIES = [
  { name: "Web Design & Development", slug: "web-design-development" },
  { name: "SEO & Marketing", slug: "seo-marketing" },
  { name: "Business Strategy", slug: "business-strategy" },
  { name: "Domain & Hosting", slug: "domain-hosting" },
  { name: "AI & Future Tech", slug: "ai-future-tech" },
];

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q;
  const category = params.category;

  let posts = DEMO_POSTS as unknown as BlogPostCard[];
  let totalPages = 1;
  let categories = FALLBACK_CATEGORIES;

  try {
    const db = await createClient();
    const result = await getPublishedPosts(db, {
      page,
      perPage: 9,
      search: q,
      categorySlug: category,
    });
    if (result.posts.length || q || category) {
      posts = result.posts as unknown as BlogPostCard[];
      totalPages = result.totalPages;
    }
    const cats = await getBlogCategories(db);
    if (cats.length) {
      categories = cats.map((c) => ({ name: c.name, slug: c.slug }));
    }
  } catch {
    // fallback to demo content
  }

  return (
    <>
      <BlogPageClient
        posts={posts}
        categories={categories}
        activeCategory={category}
        q={q}
        page={page}
        totalPages={totalPages}
      />
      <CtaBanner />
    </>
  );
}
