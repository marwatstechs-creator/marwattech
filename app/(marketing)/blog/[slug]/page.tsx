import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { BlogCard } from "@/components/marketing/blog-card";
import { ShareButtons } from "@/components/marketing/share-buttons";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import {
  getPostBySlug,
  getRelatedPosts,
  getEnabledAds,
  type EnabledAd,
  type PostWithRelations,
} from "@/lib/db/content";
import { AdUnit } from "@/components/adsense/ad-unit";
import { StickyAd } from "@/components/adsense/sticky-ad";
import { DEMO_POSTS } from "@/lib/demo";
import { sanitizeHtml } from "@/lib/sanitize";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { formatDate, initials, readingTime, absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return DEMO_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let post = DEMO_POSTS.find((p) => p.slug === slug) ?? null;
  try {
    const db = await createClient();
    post = (await getPostBySlug(db, slug)) ?? post;
  } catch {
    // fallback
  }
  if (!post) return {};

  return buildMetadata({
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? "",
    path: `/blog/${post.slug}`,
    image: post.og_image ?? post.cover_image,
    type: "article",
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
    canonical: post.canonical_url,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  type RelatedPost = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    published_at: string | null;
  };

  let post: PostWithRelations | null =
    DEMO_POSTS.find((p) => p.slug === slug) ?? null;
  let related: RelatedPost[] = DEMO_POSTS.filter((p) => p.slug !== slug).slice(
    0,
    3
  );
  let ads: EnabledAd[] = [];
  let stickyAds: EnabledAd[] = [];

  try {
    const db = await createClient();
    const data = await getPostBySlug(db, slug);
    if (data) {
      post = data;
      const rel = await getRelatedPosts(db, data, 3);
      if (rel.length) related = rel;
    } else if (!post) {
      notFound();
    }
    // In-content ad units (used between/around the article body)
    ads = await getEnabledAds(db, "in_content");
    stickyAds = await getEnabledAds(db, "sticky");
  } catch {
    if (!post) notFound();
  }

  if (!post) notFound();

  const content = sanitizeHtml(post.content);
  const category = post.blog_categories as { name: string; slug: string } | null;
  const author = post.profiles as { full_name: string | null } | null;
  const minutes = post.reading_time ?? readingTime(post.content);
  const postUrl = absoluteUrl(`/blog/${post.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: {
      "@type": "Organization",
      name: author?.full_name ?? SITE.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Blog", href: "/blog" },
            ...(category ? [{ label: category.name, href: `/blog?category=${category.slug}` }] : []),
            { label: post.title },
          ]}
        />

        {category && (
          <Link href={`/blog?category=${category.slug}`}>
            <Badge variant="gold" className="mb-4 uppercase tracking-wide">
              {category.name}
            </Badge>
          </Link>
        )}

        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-y py-4">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {initials(author?.full_name ?? SITE.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium leading-none">{author?.full_name ?? SITE.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(post.published_at)}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <AppIcon name="clock" size={14} />
            {minutes} min read
          </span>
          <div className="ml-auto">
            <ShareButtons title={post.title} url={postUrl} />
          </div>
        </div>

        {/* Cover */}
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            width={1200}
            height={675}
            className="mt-8 aspect-[16/9] w-full rounded-2xl border object-cover"
          />
        ) : (
          <div className="mt-8 grid aspect-[16/9] w-full place-items-center rounded-2xl border bg-gradient-to-br from-primary/15 via-gold/10 to-azure/15">
            <AppIcon name="sparkles" size={48} className="text-primary/40" />
          </div>
        )}

        {/* Ad: top of article */}
        {ads[0] && (
          <AdUnit
            adClient={ads[0].ad_client}
            slotId={ads[0].slot_id}
            format={ads[0].format}
            className="mt-8 rounded-xl border bg-muted/20"
          />
        )}

        {/* Content */}
        <div
          className="prose-cms mt-8"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Custom HTML / CSS / JS */}
        {post.custom_html ? (
          <div
            className="mt-10"
            dangerouslySetInnerHTML={{ __html: post.custom_html }}
          />
        ) : null}

        {/* Ad: bottom of article */}
        {ads[1] && (
          <AdUnit
            adClient={ads[1].ad_client}
            slotId={ads[1].slot_id}
            format={ads[1].format}
            className="mt-10 rounded-xl border bg-muted/20"
          />
        )}

        {/* Tags */}
        {post.post_tags && post.post_tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t pt-6">
            {post.post_tags
              .map((t) => t.blog_tags)
              .filter(
                (t): t is { id: string; name: string; slug: string } =>
                  Boolean(t)
              )
              .map((t) => (
                <Badge key={t.slug} variant="outline">
                  #{t.name}
                </Badge>
              ))}
          </div>
        )}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="font-display mb-8 text-2xl font-bold">
              Related articles
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBanner />

      {stickyAds[0] && <StickyAd ad={stickyAds[0]} />}
    </>
  );
}
