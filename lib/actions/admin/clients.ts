"use server";

import { z } from "zod";
import { requireEditor, logActivity, revalidateContent } from "@/lib/actions/admin/helpers";

const clientSchema = z.object({
  company: z.string().min(2, "Company / name is required").max(200),
  contact_name: z.string().max(200).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  website: z.string().max(300).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "lead"]).default("active"),
  user_id: z.string().uuid().nullable().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

export async function createClientRecord(input: ClientInput) {
  const { session, db } = await requireEditor();
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { data, error } = await db
    .from("clients")
    .insert({ ...parsed.data, user_id: parsed.data.user_id ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "client", data.id, { company: parsed.data.company });
  await revalidateContent(["/client"]);
  return { id: data.id };
}

export async function updateClientRecord(id: string, input: ClientInput) {
  const { session, db } = await requireEditor();
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { error } = await db
    .from("clients")
    .update({ ...parsed.data, user_id: parsed.data.user_id ?? null })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "client", id, { company: parsed.data.company });
  await revalidateContent(["/client"]);
  return { ok: true };
}

export async function deleteClientRecord(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "client", id);
  await revalidateContent(["/client"]);
  return { ok: true };
}

export async function toggleClientStatus(id: string, status: string) {
  const { session, db } = await requireEditor();
  const s = (["active", "inactive", "lead"] as const).includes(status as never)
    ? (status as "active" | "inactive" | "lead")
    : "active";
  const { error } = await db.from("clients").update({ status: s }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "client", id, { status: s });
  return { ok: true };
}
