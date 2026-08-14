import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchUdemyDeals } from "@/lib/promo/udemy-feed";
import type { Database } from "@/types/database";

/**
 * Pulls the latest Udemy deals from the public GitHub feed and stores them in
 * the promo_codes table (source = 'auto_udemy') so the public pages never
 * depend on GitHub being up at request time. Pages fall back to this cached
 * copy if the feed is unreachable.
 */
export async function syncUdemyDeals(db: SupabaseClient<Database>): Promise<{
  ok: boolean;
  count: number;
  error?: string;
}> {
  let deals;
  try {
    deals = await fetchUdemyDeals(300);
  } catch {
    return { ok: false, count: 0, error: "Feed unreachable" };
  }
  if (!deals.length) {
    return { ok: false, count: 0, error: "No deals in feed right now" };
  }

  try {
    const rows = deals.map((d) => ({
      title: d.title,
      store: "Udemy",
      code: d.code ?? "",
      discount_label: d.discount != null ? `${d.discount}% OFF` : null,
      url: d.url,
      image_url: d.image,
      category: d.category,
      tag: d.discount === 100 ? "full_paid" : "other",
      source: "auto_udemy",
      enabled: true,
      sort_order: d.discount === 100 ? 0 : 1,
    }));

    // Keep existing rows if a stale-old-row cleanup ever happens mid-write:
    // insert the fresh set first, then remove auto rows that are no longer present.
    const { data: existing } = await db
      .from("promo_codes")
      .select("id")
      .eq("source", "auto_udemy");
    const existingIds = new Set((existing ?? []).map((r) => r.id));

    const { data: inserted, error } = await db
      .from("promo_codes")
      .insert(rows)
      .select("id");
    if (error) return { ok: false, count: 0, error: error.message };

    const newIds = new Set((inserted ?? []).map((r) => r.id));
    const staleIds = [...existingIds].filter((id) => !newIds.has(id));
    if (staleIds.length) {
      await db.from("promo_codes").delete().in("id", staleIds);
    }

    return { ok: true, count: rows.length };
  } catch (e) {
    return { ok: false, count: 0, error: e instanceof Error ? e.message : "Sync failed" };
  }
}
