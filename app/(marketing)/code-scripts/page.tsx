import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CODE_SCRIPT_CATEGORIES,
  CODE_SCRIPTS_PATH,
  codeScriptUrl,
  buildExcerpt,
  type CodeScript,
} from "@/lib/code-scripts";
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

type Row = Pick<
  CodeScript,
  "id" | "title" | "slug" | "category" | "version" | "cover_image" | "content" | "created_at"
>;

export default async function CodeScriptsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const cat = CODE_SCRIPT_CATEGORIES.find((c) => c.slug === category);

  let scripts: Row[] = [];
  try {
    const db = await createClient();
    let q = db
      .from("code_scripts")
      .select("id, title, slug, category, version, cover_image, content, created_at")
      .eq("status", "published");
    if (category) q = q.eq("category", category);
    const { data } = await q.order("created_at", { ascending: false }).limit(60);
    scripts = (data ?? []) as Row[];
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {scripts.map((s) => (
              <Link
                key={s.id}
                href={codeScriptUrl(s.slug)}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  {s.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.cover_image}
                      alt={s.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="grid h-full w-full place-items-center"
                      style={{ background: "linear-gradient(135deg,#7464c6 0%,#4b3ea1 100%)" }}
                    >
                      <AppIcon name="code" size={40} className="text-white/40" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    {s.category && (
                      <Badge variant="gold" className="text-[11px] capitalize">
                        {s.category.replace("-", " ")}
                      </Badge>
                    )}
                  </div>
                  {s.version && (
                    <div className="absolute right-3 top-3">
                      <Badge className="bg-background/80 text-[11px] backdrop-blur">v{s.version}</Badge>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-primary">
                    {s.title}
                  </h3>
                  {s.content && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{buildExcerpt(s.content, 120)}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      View <AppIcon name="arrowRight" size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <CtaBanner />
    </>
  );
}
