"use server";

import { getAllPublicEntries } from "@/lib/sitemap";

export type RegenerateSitemapResult = {
  ok: boolean;
  count: number;
  urls: string[];
  error?: string;
};

/**
 * Rebuilds the full public sitemap URL list (all static pages + every
 * published dynamic page, including study courses and Udemy promo codes).
 * The sitemap is served live from app/sitemap.ts, so this action simply
 * re-collects every public URL and reports the total — handy for a manual
 * "Generate Sitemap" button in Admin → Settings.
 */
export async function regenerateSitemapAction(): Promise<RegenerateSitemapResult> {
  try {
    const entries = await getAllPublicEntries();
    const urls = entries.map((e) => e.url);
    return { ok: true, count: urls.length, urls };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      urls: [],
      error: err instanceof Error ? err.message : "Could not generate the sitemap.",
    };
  }
}
