"use server";

import { z } from "zod";
import { requireSuperAdmin, logActivity } from "@/lib/actions/admin/helpers";

const settingsSchema = z.record(z.string(), z.string());

export async function saveSettings(input: z.infer<typeof settingsSchema>) {
  const { session, db } = await requireSuperAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid settings payload" };

  const rows = Object.entries(parsed.data).map(([key, value]) => ({ key, value }));

  // Upsert in a loop — simple and safe for a small number of keys.
  for (const row of rows) {
    const { error } = await db.from("site_settings").upsert(row, { onConflict: "key" });
    if (error) return { error: error.message };
  }

  await logActivity(db, session, "update", "settings");
  return { ok: true };
}
