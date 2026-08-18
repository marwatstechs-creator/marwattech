import type { Metadata } from "next";

import { CodeScriptsGrid } from "@/components/marketing/code-scripts-grid";
import { CodeScriptsFilter } from "@/components/marketing/code-scripts-filter";
import { AdSlot } from "@/components/adsense/ad-slot";
import { PageHero } from "@/components/marketing/page-hero";
import { AppIcon } from "@/components/app-icon";
import {
  CODE_SCRIPT_CATEGORIES,
  CODE_SCRIPTS_PATH,
  CODE_SCRIPTS_PAGE_SIZE,
} from "@/lib/code-scripts";
import { type CodeScriptCard } from "@/lib/actions/public/code-scripts";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const cat = CODE_SCRIPT_CATEGORIES.find((c) => c.slug === category);
  return buildMetadata({
    title: cat ? `${cat.label} Scripts — Free Downloads | ${SITE.name}` : "Code Scripts — Free Downloads | Marwat Tech",
    description: cat
      ? `Browse ${cat.label.toLowerCase()} — ready-made code scripts with free downloads, updated regularly on ${SITE.name}.`
      : "Ready-made PHP scripts, WordPress plugins & themes, SaaS code and more — with free downloads on Marwat Tech.",
    path: category ? `${CODE_SCRIPTS_PATH}?category=${category}` : CODE_SCRIPTS_PATH,
  });
}

type SearchParams = Promise<{ category?: string; q?: string }>;

export default async function CodeScriptsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category, q } = await searchParams;
  const cat = CODE_SCRIPT_CATEGORIES.find((c) => c.slug === category);

  let scripts: CodeScriptCard[] = [];
  try {
    const db = await createClient();
    let query = db
      .from("code_scripts")
      .select("id, title, slug, category, version, cover_image, content, created_at")
      .eq("status", "published");
    if (category) query = query.eq("category", category);
    if (q?.trim()) query = query.ilike("title", `%${q.trim()}%`);
    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(CODE_SCRIPTS_PAGE_SIZE);
    scripts = (data ?? []) as CodeScriptCard[];
  } catch {
    // fallback — empty
  }

  return (
    <>
      <PageHero
        title={cat ? `${cat.label} Scripts` : "Code Scripts"}
        badge="Free downloads"
        description={
          cat
            ? `Browse ready-made ${cat.label.toLowerCase()} — updated regularly.`
            : "Ready-made PHP scripts, WordPress plugins & themes, SaaS code and more — download them free."
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdSlot area="code-scripts-top" className="mb-8 rounded-2xl border bg-card/60 py-4" />

        {/* Sticky category filter + search (blog-style) — direct child of the
            tall section so it can stick while the grid scrolls below it. */}
        <CodeScriptsFilter activeCategory={category} q={q} />

        {scripts.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed bg-muted/40 p-16 text-center">
            <AppIcon name="box" size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              {q ? "No scripts match your search — try another keyword." : "No scripts here yet — check back soon."}
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <CodeScriptsGrid initial={scripts} category={category} q={q} />
          </div>
        )}

        <AdSlot area="code-scripts-between" className="mt-10 rounded-2xl border bg-card/60 py-4" />
      </section>
    </>
  );
}
