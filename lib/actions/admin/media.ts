"use server";

import { requireEditor, logActivity } from "@/lib/actions/admin/helpers";

export async function deleteMedia(id: string) {
  const { session, db } = await requireEditor();
  const { data } = await db.from("media").select("path").eq("id", id).single();
  if (data?.path) {
    await db.storage.from("media").remove([data.path]);
  }
  const { error } = await db.from("media").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "media", id);
  return { ok: true };
}
