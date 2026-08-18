import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { AdSlot } from "@/components/adsense/ad-slot";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CODE_SCRIPT_CATEGORIES,
  CODE_SCRIPTS_PATH,
  codeScriptUrl,
  buildSoftwareJsonLd,
  buildFaqJsonLd,
  buildSeoTitle,
  buildSeoDescription,
  stripSourceLinks,
  type CodeScript,
} from "@/lib/code-scripts";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo";
import { sanitizeHtml } from "@/lib/sanitize";
import { SITE } from "@/lib/constants";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

function JsonLd({ data }: { data: unknown }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = await createClient();
  const { data } = await db
    .from("code_scripts")
    .select("title, slug, category, version, cover_image, seo_title, seo_description, excerpt, content, created_at, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return {};
  const script = {
    ...data,
    seo_title: data.seo_title ?? buildSeoTitle(data),
    seo_description: data.seo_description ?? buildSeoDescription(data),
  } as Partial<CodeScript>;

  return buildMetadata({
    title: script.seo_title!,
    description: script.seo_description!,
    path: codeScriptUrl(slug),
    image: script.cover_image ?? null,
    type: "article",
    publishedTime: script.created_at ?? null,
    modifiedTime: script.updated_at ?? null,
    authors: [SITE.name],
    keywords: [data.category, data.version].filter(Boolean) as string[],
  });
}

export default async function CodeScriptDetailPage({ params }: Props) {
  const { slug } = await params;
  const db = await createClient();

  const { data: script } = await db
    .from("code_scripts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!script) notFound();

  const s = script as CodeScript;
  const cat = CODE_SCRIPT_CATEGORIES.find((c) => c.slug === s.category);

  const dlLinks = (Array.isArray(s.download_links) ? s.download_links : [])
    .map((l) => l?.trim())
    .filter((l): l is string => Boolean(l));
  const downloadLinks = dlLinks.length ? dlLinks : s.download_url ? [s.download_url] : [];

  const softwareLd = buildSoftwareJsonLd(s);
  const faqLd = buildFaqJsonLd(Array.isArray(s.faqs) ? s.faqs : []);

  return (
    <>
      <JsonLd data={softwareLd} />
      <JsonLd data={faqLd} />

      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex justify-center">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Code Scripts", href: CODE_SCRIPTS_PATH },
                ...(cat ? [{ label: cat.label, href: `${CODE_SCRIPTS_PATH}?category=${cat.slug}` }] : []),
                { label: s.title },
              ]}
            />
          </div>

          {/* Cover */}
          <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border bg-muted shadow-sm">
            {s.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.cover_image} alt={s.title} className="h-full w-full object-cover" />
            ) : (
              <div
                className="grid h-full w-full place-items-center"
                style={{ background: "linear-gradient(135deg,#7464c6 0%,#4b3ea1 100%)" }}
              >
                <AppIcon name="code" size={56} className="text-white/40" />
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              {cat && <Badge variant="gold" className="capitalize">{cat.label}</Badge>}
              {s.version && <Badge variant="outline">v{s.version}</Badge>}
              <Badge variant="secondary">Free Download</Badge>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{s.title}</h1>
            {s.excerpt && <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{s.excerpt}</p>}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {s.download_url ? (
                <Button asChild variant="gold" className="btn-3d">
                  <a href={s.download_url} target="_blank" rel="nofollow noopener noreferrer">
                    <AppIcon name="download" size={16} className="mr-1.5" />
                    Download {s.version ? `v${s.version}` : "Now"}
                  </a>
                </Button>
              ) : (
                <Button variant="gold" disabled>Download coming soon</Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content + FAQ */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <AdSlot area="code-scripts-article-top" className="mb-8 rounded-2xl border bg-card/60 py-4" />

        {s.content && (
          <div
            className="prose-cms text-[15px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(stripSourceLinks(s.content)) }}
          />
        )}

        <AdSlot area="code-scripts-article-after-download" className="mt-8 rounded-2xl border bg-card/60 py-4" />

        {downloadLinks.length > 0 && (
          <div className="mt-10 rounded-2xl border bg-muted/40 p-6 sm:p-8">
            <h2 className="font-display mb-1 text-2xl font-bold">Download</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Grab the package from any of the mirrors below — all point to the same release.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {downloadLinks.map((link, i) => (
                <Button key={i} asChild variant="gold" className="btn-3d">
                  <a href={link} target="_blank" rel="nofollow noopener noreferrer">
                    <AppIcon name="download" size={16} className="mr-1.5" />
                    {downloadLinks.length > 1 ? `Mirror ${i + 1}` : "Download"} {s.version ? `v${s.version}` : ""}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}

        <AdSlot area="code-scripts-article-below-download" className="mt-8 rounded-2xl border bg-card/60 py-4" />

        {Array.isArray(s.faqs) && s.faqs.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display mb-4 text-2xl font-bold">Frequently asked questions</h2>
            <div className="space-y-3">
              {s.faqs.map((f, i) => (
                <div key={i} className="rounded-xl border bg-card p-5">
                  <h3 className="font-semibold">{f.q}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <AdSlot area="code-scripts-article-bottom" className="mt-10 rounded-2xl border bg-card/60 py-4" />
      </section>
    </>
  );
}
