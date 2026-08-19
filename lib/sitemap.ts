import type { MetadataRoute } from "next";

import { SITE, SERVICES, PORTFOLIO_CATEGORIES, BLOG_CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { DEMO_SERVICES, DEMO_PROJECTS, DEMO_POSTS } from "@/lib/demo";
import { promoCodeSlug } from "@/lib/promo/slug";

type Entry = MetadataRoute.Sitemap[number];

const now = () => new Date();
const url = (path: string) => `${SITE.url}${path}`;

/**
 * All static public pages. Kept in one place so the auto-generated sitemap,
 * the robots.txt reference and the admin "Generate Sitemap" action all agree.
 */
export function getStaticPublicEntries(): Entry[] {
  return [
    { url: url("/"), lastModified: now(), changeFrequency: "weekly", priority: 1 },
    { url: url("/about"), lastModified: now(), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/services"), lastModified: now(), changeFrequency: "weekly", priority: 0.9 },
    ...SERVICES.map((s) => ({
      url: url(s.href),
      lastModified: now(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: url("/portfolio"), lastModified: now(), changeFrequency: "weekly", priority: 0.9 },
    ...PORTFOLIO_CATEGORIES.filter((c) => c.slug !== "all").map((c) => ({
      url: url(`/portfolio/${c.slug}`),
      lastModified: now(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: url("/pricing"), lastModified: now(), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/testimonials"), lastModified: now(), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/careers"), lastModified: now(), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/blog"), lastModified: now(), changeFrequency: "daily", priority: 0.9 },
    ...BLOG_CATEGORIES.map((c) => ({
      url: url(`/blog/category/${c.slug}`),
      lastModified: now(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: url("/contact"), lastModified: now(), changeFrequency: "yearly", priority: 0.7 },
    { url: url("/free-mockup"), lastModified: now(), changeFrequency: "yearly", priority: 0.7 },

    // Study + study materials
    { url: url("/study"), lastModified: now(), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/study-materials"), lastModified: now(), changeFrequency: "weekly", priority: 0.7 },

    // Free courses + Udemy promo-code page
    { url: url("/free-courses"), lastModified: now(), changeFrequency: "daily", priority: 0.9 },

    // Code scripts
    { url: url("/code-scripts"), lastModified: now(), changeFrequency: "weekly", priority: 0.9 },

    // Support, payment & legal
    { url: url("/technical-support"), lastModified: now(), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/payment"), lastModified: now(), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/privacy-policy"), lastModified: now(), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms-of-service"), lastModified: now(), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/refund-policy"), lastModified: now(), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/domain-and-hosting-terms"), lastModified: now(), changeFrequency: "yearly", priority: 0.2 },
  ];
}

/** Fetch every row of a Supabase query (a single request is capped at 1000 rows). */
const FETCH_PAGE = 1000;
async function fetchAllRows<T>(query: (from: number, to: number) => Promise<{ data: T[] | null }>): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    const { data } = await query(from, from + FETCH_PAGE - 1);
    const rows = (data ?? []) as T[];
    all.push(...rows);
    if (!data || data.length < FETCH_PAGE) break;
    from += FETCH_PAGE;
  }
  return all;
}

/** Published dynamic content (services, portfolio, blog, pages, code scripts, study, promo codes). */
export async function getDynamicPublicEntries(): Promise<Entry[]> {
  let services = DEMO_SERVICES;
  let projects = DEMO_PROJECTS;
  let posts = DEMO_POSTS;
  let pages: { slug: string; updated_at: string }[] = [];
  let codeScripts: { slug: string; updated_at: string }[] = [];
  let studySubjects: { slug: string }[] = [];
  let studyWeeks: { subjectSlug: string; weekNumber: number }[] = [];
  let promoCodes: { title: string; id: string }[] = [];

  try {
    const db = await createClient();
    // Every query is paginated — a single Supabase request is capped at 1000
    // rows, so large tables (e.g. 3900+ code scripts) would otherwise be
    // silently truncated in the sitemap.
    const [s, p, b, pg, cs] = await Promise.all([
      fetchAllRows<{ slug: string; updated_at: string }>(async (from, to) =>
        db.from("services").select("slug, updated_at").eq("status", "published").range(from, to)
      ),
      fetchAllRows<{ slug: string; updated_at: string }>(async (from, to) =>
        db.from("portfolio_items").select("slug, updated_at").eq("status", "published").range(from, to)
      ),
      fetchAllRows<{ slug: string; updated_at: string }>(async (from, to) =>
        db.from("blog_posts").select("slug, updated_at").eq("status", "published").range(from, to)
      ),
      fetchAllRows<{ slug: string; updated_at: string }>(async (from, to) =>
        db.from("pages").select("slug, updated_at").eq("status", "published").range(from, to)
      ),
      fetchAllRows<{ slug: string; updated_at: string }>(async (from, to) =>
        db.from("code_scripts").select("slug, updated_at").eq("status", "published").range(from, to)
      ),
    ]);
    if (s.length) services = s as typeof services;
    if (p.length) projects = p as typeof projects;
    if (b.length) posts = b as typeof posts;
    if (pg.length) pages = pg as typeof pages;
    if (cs.length) codeScripts = cs as typeof codeScripts;

    // Study subjects + their published weeks (so /study/[slug]/[week] is indexed).
    const [subj, weeks] = await Promise.all([
      fetchAllRows<{ slug: string }>(async (from, to) =>
        db.from("study_subjects").select("slug").eq("published", true).range(from, to)
      ),
      fetchAllRows<{ week_number: number; study_subjects: { slug: string } | null }>(async (from, to) =>
        db.from("study_weeks")
          .select("week_number, study_subjects(slug)")
          .eq("published", true)
          .range(from, to)
      ),
    ]);
    studySubjects = subj;
    for (const w of weeks) {
      if (w.study_subjects?.slug && typeof w.week_number === "number") {
        studyWeeks.push({ subjectSlug: w.study_subjects.slug, weekNumber: w.week_number });
      }
    }

    // Udemy promo codes → treated as pages so they can rank.
    promoCodes = await fetchAllRows<{ title: string; id: string }>(async (from, to) =>
      db.from("promo_codes").select("title, id").eq("enabled", true).range(from, to)
    );
  } catch {
    // Supabase unavailable — fall back to demo content only.
  }

  return [
    ...services.map((s) => ({
      url: url(`/services/${s.slug}`),
      lastModified: s.updated_at ?? now(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...projects.map((p) => ({
      url: url(`/portfolio/${p.slug}`),
      lastModified: p.updated_at ?? now(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: url(`/blog/${p.slug}`),
      lastModified: p.updated_at ?? now(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...pages.map((p) => ({
      url: url(`/pages/${p.slug}`),
      lastModified: p.updated_at ?? now(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...codeScripts.map((c) => ({
      url: url(`/code-scripts/${c.slug}`),
      lastModified: c.updated_at ?? now(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...studySubjects.map((s) => ({
      url: url(`/study/${s.slug}`),
      lastModified: now(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...studyWeeks.map((w) => ({
      url: url(`/study/${w.subjectSlug}/${w.weekNumber}`),
      lastModified: now(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...promoCodes.map((c) => ({
      url: url(`/free-courses/${promoCodeSlug(c.title, c.id)}`),
      lastModified: now(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

/** Full public sitemap: static pages + all published dynamic content. */
export async function getAllPublicEntries(): Promise<Entry[]> {
  return [...getStaticPublicEntries(), ...(await getDynamicPublicEntries())];
}
