"use server";

import { z } from "zod";
import { requireStaff, logActivity } from "@/lib/actions/admin/helpers";

const statusSchema = z.enum(["new", "reviewed", "interview", "rejected", "hired"]);

export async function updateApplicationStatus(id: string, status: z.infer<typeof statusSchema>) {
  const { session, db } = await requireStaff();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };
  const { error } = await db.from("applications").update({ status: parsed.data }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "application", id, { status: parsed.data });
  return { ok: true };
}

export async function deleteApplication(id: string) {
  const { session, db } = await requireStaff();
  const { error } = await db.from("applications").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "application", id);
  return { ok: true };
}
