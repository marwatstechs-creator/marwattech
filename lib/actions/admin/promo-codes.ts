"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
} from "@/lib/actions/admin/helpers";
import { syncUdemyDeals } from "@/lib/promo/sync-udemy-deals";

const promoCodeSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  store: z.string().min(1, "Store is required").max(80),
  code: z.string().min(1, "Promo code is required").max(60),
  discount_label: z.string().max(80).optional().or(z.literal("")),
  url: z.string().min(1, "Link is required").max(600),
  image_url: z.string().max(600).optional().or(z.literal("")),
  category: z.string().max(80).optional().or(z.literal("")),
  tag: z.enum(["latest", "full_paid", "other"]).default("other"),
  expires_at: z.string().optional().or(z.literal("")),
  enabled: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

export type PromoCodeInput = z.infer<typeof promoCodeSchema>;

function parseExpiry(value: string | undefined): string | null {
  if (!value) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59Z` : value;
  return iso;
}

export async function createPromoCode(input: PromoCodeInput) {
  const { session, db } = await requireEditor();
  const parsed = promoCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("promo_codes")
    .insert({
      title: parsed.data.title,
      store: parsed.data.store,
      code: parsed.data.code,
      discount_label: parsed.data.discount_label || null,
      url: parsed.data.url,
      image_url: parsed.data.image_url || null,
      category: parsed.data.category || null,
      tag: parsed.data.tag,
      source: "manual",
      expires_at: parseExpiry(parsed.data.expires_at),
      enabled: parsed.data.enabled,
      sort_order: parsed.data.sort_order,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "promo_code", data.id, {
    title: parsed.data.title,
  });
  await revalidateContent(["/promo-codes"]);
  return { id: data.id };
}

export async function updatePromoCode(id: string, input: PromoCodeInput) {
  const { session, db } = await requireEditor();
  const parsed = promoCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("promo_codes")
    .update({
      title: parsed.data.title,
      store: parsed.data.store,
      code: parsed.data.code,
      discount_label: parsed.data.discount_label || null,
      url: parsed.data.url,
      image_url: parsed.data.image_url || null,
      category: parsed.data.category || null,
      tag: parsed.data.tag,
      expires_at: parseExpiry(parsed.data.expires_at),
      enabled: parsed.data.enabled,
      sort_order: parsed.data.sort_order,
    })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "promo_code", id, {
    title: parsed.data.title,
  });
  await revalidateContent(["/promo-codes"]);
  return { id: data.id };
}

export async function deletePromoCode(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("promo_codes").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "promo_code", id);
  await revalidateContent(["/promo-codes"]);
  return { ok: true };
}

export async function togglePromoCode(id: string, enabled: boolean) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("promo_codes").update({ enabled }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "promo_code", id, { enabled });
  await revalidateContent(["/promo-codes"]);
  return { ok: true };
}

/** Manually refresh the auto Udemy deals into the promo_codes table. */
export async function syncUdemyDealsAction() {
  const { db } = await requireEditor();
  const res = await syncUdemyDeals(db);
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");
  if (!res.ok) return { error: res.error ?? "Sync failed" };
  return { ok: true, count: res.count };
}
