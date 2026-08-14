import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/sanitize";
import { buildMetadata } from "@/lib/seo";
import { webPageJsonLd } from "@/lib/seo-jsonld";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let page: { title: string; meta_title: string | null; meta_description: string | null } | null =
    null;
  try {
    const db = await createClient();
    const { data } = await db
      .from("pages")
      .select("title, meta_title, meta_description")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    page = data ?? null;
  } catch {
    // fallback
  }
  if (!page) return {};
  return buildMetadata({
    title: page.meta_title ?? page.title,
    description: page.meta_description ?? undefined,
    path: `/pages/${slug}`,
  });
}

export default async function PageDetailPage({ params }: Props) {
  const { slug } = await params;

  let page: {
    title: string;
    content: string;
    custom_html: string | null;
    meta_description: string | null;
  } | null = null;

  try {
    const db = await createClient();
    const { data } = await db
      .from("pages")
      .select("title, content, custom_html, meta_description")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    page = data ?? null;
  } catch {
    page = null;
  }

  if (!page) notFound();

  const content = sanitizeHtml(page.content);

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          title: page.title,
          description: page.meta_description,
          path: `/pages/${slug}`,
        })}
      />
      <PageHero title={page.title} description={page.meta_description ?? undefined} />

      <section className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
        <article
          className="prose-cms"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        {page.custom_html ? (
          <div
            className="mt-10"
            dangerouslySetInnerHTML={{ __html: page.custom_html }}
          />
        ) : null}
      </section>

      <CtaBanner />
    </>
  );
}
