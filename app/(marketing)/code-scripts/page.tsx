import type { Metadata } from "next";
import Link from "next/link";

import { CodeScriptsGrid } from "@/components/marketing/code-scripts-grid";
import { PageHero } from "@/components/marketing/page-hero";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
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

export default async function CodeScriptsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const cat = CODE_SCRIPT_CATEGORIES.find((c) => c.slug === category);

  let scripts: CodeScriptCard[] = [];
  try {
    const db = await createClient();
    let q = db
      .from("code_scripts")
      .select("id, title, slug, category, version, cover_image, content, created_at")
      .eq("status", "published");
    if (category) q = q.eq("category", category);
    const { data } = await q
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

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category filter */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Link href={CODE_SCRIPTS_PATH}>
            <Badge variant={!category ? "default" : "outline"} className="px-3 py-1.5 capitalize">
              All
            </Badge>
          </Link>
          {CODE_SCRIPT_CATEGORIES.map((c) => (
            <Link key={c.slug} href={`${CODE_SCRIPTS_PATH}?category=${c.slug}`}>
              <Badge variant={category === c.slug ? "default" : "outline"} className="px-3 py-1.5 capitalize">
                {c.label}
              </Badge>
            </Link>
          ))}
        </div>

        {scripts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center">
            <AppIcon name="box" size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No scripts here yet — check back soon.</p>
          </div>
        ) : (
          <CodeScriptsGrid initial={scripts} category={category} />
        )}
      </section>
    </>
  );
}
