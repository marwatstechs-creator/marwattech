"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
} from "@/lib/actions/admin/helpers";

const adSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  ad_client: z
    .string()
    .min(1, "AdSense client ID is required")
    .max(60)
    .regex(/^[a-zA-Z0-9-]+$/, "Format: ca-pub-XXXXXXXX (letters, numbers, hyphens)"),
  slot_id: z.string().max(40).optional().or(z.literal("")),
  format: z.enum(["auto", "fluid", "rectangle", "horizontal", "vertical"]).default("auto"),
  placement: z.enum(["in_content", "listing"]).default("in_content"),
  enabled: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

export type AdInput = z.infer<typeof adSchema>;

/** Ad changes affect every ad-bearing page → revalidate the whole site (rare op). */
async function revalidateAds() {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");
  await revalidateContent(["/blog", "/study-materials", "/"]);
}

export async function createAd(input: AdInput) {
  const { session, db } = await requireEditor();
  const parsed = adSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("ads")
    .insert({
      ...parsed.data,
      slot_id: parsed.data.slot_id || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "ad", data.id, { name: parsed.data.name });
  await revalidateAds();
  return { id: data.id };
}

export async function updateAd(id: string, input: AdInput) {
  const { session, db } = await requireEditor();
  const parsed = adSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("ads")
    .update({ ...parsed.data, slot_id: parsed.data.slot_id || null })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "ad", id, { name: parsed.data.name });
  await revalidateAds();
  return { id: data.id };
}

export async function deleteAd(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("ads").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "ad", id);
  await revalidateAds();
  return { ok: true };
}

export async function toggleAd(id: string, enabled: boolean) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("ads").update({ enabled }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "ad", id, { enabled });
  await revalidateAds();
  return { ok: true };
}
