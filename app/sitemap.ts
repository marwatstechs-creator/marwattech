import type { MetadataRoute } from "next";

import { SITE, SERVICES, PORTFOLIO_CATEGORIES, BLOG_CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { DEMO_SERVICES, DEMO_PROJECTS, DEMO_POSTS } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...SERVICES.map((s) => ({
      url: `${SITE.url}${s.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE.url}/portfolio`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...PORTFOLIO_CATEGORIES.filter((c) => c.slug !== "all").map((c) => ({
      url: `${SITE.url}/portfolio/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE.url}/testimonials`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...BLOG_CATEGORIES.map((c) => ({
      url: `${SITE.url}/blog/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${SITE.url}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE.url}/free-mockup`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
  ];

  // Published dynamic content (falls back to demo when Supabase isn't configured)
  let services = DEMO_SERVICES;
  let projects = DEMO_PROJECTS;
  let posts = DEMO_POSTS;
  let pages: { slug: string; updated_at: string }[] = [];

  try {
    const db = await createClient();
    const [s, p, b, pg] = await Promise.all([
      db.from("services").select("slug, updated_at").eq("status", "published"),
      db.from("portfolio_items").select("slug, updated_at").eq("status", "published"),
      db.from("blog_posts").select("slug, updated_at").eq("status", "published"),
      db.from("pages").select("slug, updated_at").eq("status", "published"),
    ]);
    if (s.data?.length) services = s.data as typeof services;
    if (p.data?.length) projects = p.data as typeof projects;
    if (b.data?.length) posts = b.data as typeof posts;
    if (pg.data?.length) pages = pg.data as typeof pages;
  } catch {
    // fallback
  }

  const contentRoutes: MetadataRoute.Sitemap = [
    ...services.map((s) => ({
      url: `${SITE.url}/services/${s.slug}`,
      lastModified: s.updated_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...projects.map((p) => ({
      url: `${SITE.url}/portfolio/${p.slug}`,
      lastModified: p.updated_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${SITE.url}/blog/${p.slug}`,
      lastModified: p.updated_at ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...pages.map((p) => ({
      url: `${SITE.url}/pages/${p.slug}`,
      lastModified: p.updated_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...contentRoutes];
}
