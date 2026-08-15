import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";
import { SITE } from "@/lib/constants";

type BuildMetadataArgs = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
  keywords?: string[];
  noindex?: boolean;
  canonical?: string | null;
};

let cachedOgImage: { url: string; at: number } | null = null;
const OG_CACHE_TTL = 60_000; // 1 minute

/**
 * The default social-share image configured in Admin → Settings
 * ("Default social share image URL"). Falls back to og-default.png.
 * Cached briefly to avoid a DB hit on every metadata render.
 */
export async function getDefaultOgImage(): Promise<string> {
  const now = Date.now();
  if (cachedOgImage && now - cachedOgImage.at < OG_CACHE_TTL) {
    return cachedOgImage.url;
  }
  let url = `${SITE.url}/og-default.png`;
  try {
    const db = await createClient();
    const settings = await getSiteSettings(db);
    const custom = settings.og_image?.trim();
    if (custom) url = custom;
  } catch {
    // fall back to the static default
  }
  cachedOgImage = { url, at: now };
  return url;
}

/**
 * Build a consistent Metadata object for every page (FR-23).
 * Also sets Open Graph + Twitter card fields. When no image is passed,
 * the default share image from Admin → Settings is used.
 */
export async function buildMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  keywords,
  noindex,
  canonical,
}: BuildMetadataArgs): Promise<Metadata> {
  const url = canonical ?? `${SITE.url}${path}`;
  const ogImage = image ?? (await getDefaultOgImage());

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      locale: "en_US",
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
