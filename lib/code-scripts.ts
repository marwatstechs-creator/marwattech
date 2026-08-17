import { SITE } from "@/lib/constants";
import type { IconName } from "@/lib/icons";

export type CodeScript = {
  id: string;
  source_url: string;
  title: string;
  slug: string;
  category: string | null;
  version: string | null;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  source_image: string | null;
  download_url: string | null;
  source_download_url: string | null;
  download_links: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  faqs: { q: string; a: string }[];
  json_ld: unknown | null;
  status: string;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
};

/** Curated categories that also drive the mega menu + listing filters. */
export const CODE_SCRIPT_CATEGORIES: {
  slug: string;
  label: string;
  icon: IconName;
  desc: string;
}[] = [
  { slug: "php-scripts", label: "PHP Scripts", icon: "code", desc: "Standalone PHP apps & tools" },
  { slug: "wordpress-plugins", label: "WordPress Plugins", icon: "box", desc: "Plugins to extend your site" },
  { slug: "wordpress-themes", label: "WordPress Themes", icon: "design", desc: "Ready-made themes" },
  { slug: "saas-apps", label: "SaaS & Web Apps", icon: "rocket", desc: "Full SaaS & web app code" },
  { slug: "laravel", label: "Laravel", icon: "database", desc: "Laravel packages & boilerplates" },
  { slug: "javascript", label: "JavaScript & React", icon: "ai", desc: "JS, React & Next.js code" },
  { slug: "ecommerce", label: "E-Commerce", icon: "ecommerce", desc: "Stores, carts & marketplaces" },
  { slug: "tools", label: "Tools & Utilities", icon: "settings", desc: "Dev tools & snippets" },
];

export const CODE_SCRIPTS_PATH = "/code-scripts";
export const CODE_SCRIPTS_PAGE_SIZE = 24;
export const codeScriptUrl = (slug: string) => `${CODE_SCRIPTS_PATH}/${slug}`;

/** Source site we never want to backlink to (kept out of links/content). */
export const CODE_SCRIPTS_SOURCE_HOST = "nullphpscript.com";

/** Remove source-site links, hotlinked images and JSON-LD — keep link text. */
export function stripSourceLinks(html: string): string {
  let out = html || "";
  // Drop any <script> block that references the source site (e.g. its JSON-LD).
  out = out.replace(/<script\b[^>]*>[\s\S]*?nullphpscript\.com[\s\S]*?<\/script>/gi, "");
  // Drop image tags that hotlink the source site.
  out = out.replace(/<img\b[^>]*src=["'][^"']*nullphpscript\.com[^"']*["'][^>]*>/gi, "");
  // Remove anchors pointing at the source site, keep their visible text.
  out = out.replace(
    /<a\b[^>]*href=["'][^"']*nullphpscript\.com[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
    "$1"
  );
  return out;
}

/** Extract every <loc> URL from a sitemap (or sitemap index) XML document. */
export function parseSitemapUrls(xml: string): string[] {
  if (!xml) return [];
  const urls: string[] = [];
  const re = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const u = (m[1] ?? "").trim();
    if (u) urls.push(u);
  }
  return urls;
}

/** Pull a version out of scraped text, e.g. "ver 2.0", "Version 1.4.2", "v3". */
export function extractVersion(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(/ver(?:sion)?[\s:.-]*v?(\d+(?:\.\d+)+)/i);
  if (m) return m[1];
  const m2 = text.match(/\bv(\d+(?:\.\d+)+)\b/i);
  return m2 ? m2[1] : null;
}

/** Strip HTML tags and collapse whitespace — used for excerpts/meta. */
export function plainText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a short excerpt from the content. */
export function buildExcerpt(
  content: string | null | undefined,
  max = 160
): string {
  const text = plainText(content);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** Default SEO title for a script. */
export function buildSeoTitle(script: Pick<CodeScript, "title" | "version" | "category">): string {
  const v = script.version ? ` v${script.version}` : "";
  return `${script.title}${v} — Free Download | ${SITE.name}`;
}

/** Default SEO meta description for a script. */
export function buildSeoDescription(
  script: Pick<CodeScript, "seo_description" | "excerpt" | "content" | "title">
): string {
  if (script.seo_description) return script.seo_description;
  const text = script.excerpt || buildExcerpt(script.content);
  return text || `${script.title} — free download on ${SITE.name}.`;
}

/** SoftwareApplication JSON-LD for a script detail page. */
export function buildSoftwareJsonLd(
  script: Pick<CodeScript, "title" | "slug" | "category" | "version" | "seo_description" | "cover_image" | "created_at" | "updated_at">
): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: script.title,
    url: `${SITE.url}${codeScriptUrl(script.slug)}`,
    applicationCategory: script.category ?? "DeveloperApplication",
    operatingSystem: "Web",
    ...(script.version ? { softwareVersion: script.version } : {}),
    ...(script.seo_description ? { description: script.seo_description } : {}),
    ...(script.cover_image ? { image: script.cover_image } : {}),
    ...(script.created_at ? { datePublished: script.created_at } : {}),
    ...(script.updated_at ? { dateModified: script.updated_at } : {}),
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  return node;
}

/** FAQPage JSON-LD for the FAQ section. */
export function buildFaqJsonLd(
  faqs: { q: string; a: string }[]
): Record<string, unknown> | null {
  if (!faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
