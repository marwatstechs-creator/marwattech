import type { Metadata } from "next";
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

/**
 * Build a consistent Metadata object for every page (FR-23).
 * Also sets Open Graph + Twitter card fields with a default share image.
 */
export function buildMetadata({
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
}: BuildMetadataArgs): Metadata {
  const url = canonical ?? `${SITE.url}${path}`;
  const ogImage = image ?? `${SITE.url}/og-default.png`;

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
