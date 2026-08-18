import type { MetadataRoute } from "next";

import { getAllPublicEntries } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getAllPublicEntries();
}
