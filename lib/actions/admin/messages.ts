"use server";

import { z } from "zod";
import { requireStaff, logActivity } from "@/lib/actions/admin/helpers";

const statusSchema = z.enum(["new", "read", "replied", "archived"]);

const notesSchema = z.object({
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export async function updateContactStatus(id: string, status: z.infer<typeof statusSchema>) {
  const { session, db } = await requireStaff();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };
  const { error } = await db.from("contact_messages").update({ status: parsed.data }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "contact_message", id, { status: parsed.data });
  return { ok: true };
}

export async function updateContactNotes(id: string, input: z.infer<typeof notesSchema>) {
  const { session, db } = await requireStaff();
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid notes" };
  const { error } = await db.from("contact_messages").update({ internal_notes: parsed.data.notes || null }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update_notes", "contact_message", id);
  return { ok: true };
}

export async function updateSupportStatus(id: string, status: z.infer<typeof statusSchema>) {
  const { session, db } = await requireStaff();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };
  const { error } = await db.from("support_tickets").update({ status: parsed.data }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "support_ticket", id, { status: parsed.data });
  return { ok: true };
}

export async function updateSupportNotes(id: string, input: z.infer<typeof notesSchema>) {
  const { session, db } = await requireStaff();
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid notes" };
  const { error } = await db.from("support_tickets").update({ internal_notes: parsed.data.notes || null }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update_notes", "support_ticket", id);
  return { ok: true };
}

export async function updateMockupStatus(id: string, status: z.infer<typeof statusSchema>) {
  const { session, db } = await requireStaff();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };
  const { error } = await db.from("mockup_requests").update({ status: parsed.data }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "mockup_request", id, { status: parsed.data });
  return { ok: true };
}

export async function updateMockupNotes(id: string, input: z.infer<typeof notesSchema>) {
  const { session, db } = await requireStaff();
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid notes" };
  const { error } = await db.from("mockup_requests").update({ internal_notes: parsed.data.notes || null }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update_notes", "mockup_request", id);
  return { ok: true };
}

export async function deleteContactMessage(id: string) {
  const { session, db } = await requireStaff();
  const { error } = await db.from("contact_messages").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "contact_message", id);
  return { ok: true };
}
