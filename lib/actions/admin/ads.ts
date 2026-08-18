"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
} from "@/lib/actions/admin/helpers";
import { getAdArea, parseAdSenseCode } from "@/lib/ads";

const adSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  ad_client: z
    .string()
    .min(1, "AdSense client ID is required")
    .max(60)
    .regex(/^[a-zA-Z0-9-]+$/, "Format: ca-pub-XXXXXXXX (letters, numbers, hyphens)"),
  slot_id: z.string().max(40).optional().or(z.literal("")),
  mobile_slot_id: z.string().max(40).optional().or(z.literal("")),
  mobile_format: z.enum(["auto", "fluid", "rectangle", "horizontal", "vertical"]).default("auto"),
  format: z.enum(["auto", "fluid", "rectangle", "horizontal", "vertical"]).default("auto"),
  placement: z.enum(["in_content", "listing", "sticky", "sidebar"]).default("in_content"),
  area: z.string().max(80).nullable().optional(),
  enabled: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

/**
 * Build an AdInput from a pasted AdSense <ins> snippet. Parses client id,
 * slot id and format out of the code so the admin can just paste it.
 */
function adInputFromCode(code: string, base: Partial<AdInput> = {}): AdInput {
  const parsed = parseAdSenseCode(code);
  return {
    name: base.name ?? "Configured ad",
    ad_client: parsed.ad_client ?? base.ad_client ?? "",
    slot_id: parsed.slot_id ?? base.slot_id ?? "",
    mobile_format: (base.mobile_format ?? "auto") as AdInput["mobile_format"],
    format: (parsed.format ?? base.format ?? "auto") as AdInput["format"],
    placement: (base.placement ?? "in_content") as AdInput["placement"],
    area: base.area ?? null,
    enabled: base.enabled ?? true,
    sort_order: base.sort_order ?? 0,
  };
}

export type AdInput = z.infer<typeof adSchema>;

/** Ad changes affect every ad-bearing page → revalidate the whole site (rare op). */
async function revalidateAds() {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");
  await revalidateContent(["/blog", "/study-materials", "/"]);
}

/**
 * Save (create or update) the ad for a named area from a pasted AdSense
 * snippet. The pasted code is parsed for client id / slot / format server-side.
 */
export async function saveAdForArea(areaKey: string, code: string) {
  const { session, db } = await requireEditor();
  const area = getAdArea(areaKey);
  if (!area) return { error: "Unknown ad area" };

  const input = adInputFromCode(code, {
    name: area.section,
    area: areaKey,
    placement: "in_content",
  });
  const parsed = adSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid AdSense code" };
  }

  const { data: existing } = await db
    .from("ads")
    .select("id")
    .eq("area", areaKey)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("ads")
      .update({ ...parsed.data, area: areaKey })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    await logActivity(db, session, "update", "ad", existing.id, { area: areaKey });
  } else {
    const { data, error } = await db
      .from("ads")
      .insert({ ...parsed.data, area: areaKey })
      .select("id")
      .single();
    if (error) return { error: error.message };
    await logActivity(db, session, "create", "ad", data.id, { area: areaKey });
  }
  await revalidateAds();
  return { ok: true };
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
      mobile_slot_id: parsed.data.mobile_slot_id || null,
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
    .update({ ...parsed.data, slot_id: parsed.data.slot_id || null, mobile_slot_id: parsed.data.mobile_slot_id || null })
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
