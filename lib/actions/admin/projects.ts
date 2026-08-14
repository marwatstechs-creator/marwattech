"use server";

import { z } from "zod";
import { requireEditor, logActivity, revalidateContent } from "@/lib/actions/admin/helpers";

const projectSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  client_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  description: z.string().max(3000).optional().or(z.literal("")),
  status: z.enum(["planning", "in_progress", "review", "completed", "on_hold"]).default("planning"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().max(10).default("USD"),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export async function createProject(input: ProjectInput) {
  const { session, db } = await requireEditor();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { data, error } = await db
    .from("client_projects")
    .insert({
      ...parsed.data,
      client_id: parsed.data.client_id ?? null,
      user_id: parsed.data.user_id ?? null,
      start_date: parsed.data.start_date || null,
      end_date: parsed.data.end_date || null,
      budget: parsed.data.budget ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "project", data.id, { title: parsed.data.title });
  await revalidateContent(["/client/projects"]);
  return { id: data.id };
}

export async function updateProject(id: string, input: ProjectInput) {
  const { session, db } = await requireEditor();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { error } = await db
    .from("client_projects")
    .update({
      ...parsed.data,
      client_id: parsed.data.client_id ?? null,
      user_id: parsed.data.user_id ?? null,
      start_date: parsed.data.start_date || null,
      end_date: parsed.data.end_date || null,
      budget: parsed.data.budget ?? null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "project", id, { title: parsed.data.title });
  await revalidateContent(["/client/projects"]);
  return { ok: true };
}

export async function deleteProject(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("client_projects").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "project", id);
  await revalidateContent(["/client/projects"]);
  return { ok: true };
}

export async function toggleProjectStatus(id: string, status: string) {
  const { session, db } = await requireEditor();
  const allowed = ["planning", "in_progress", "review", "completed", "on_hold"] as const;
  const s = (allowed as readonly string[]).includes(status) ? (status as (typeof allowed)[number]) : "planning";
  const { error } = await db.from("client_projects").update({ status: s }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "project", id, { status: s });
  await revalidateContent(["/client/projects"]);
  return { ok: true };
}
