"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
} from "@/lib/actions/admin/helpers";

const schema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  department: z.string().max(120).optional().or(z.literal("")),
  location: z.string().max(150).optional().or(z.literal("")),
  job_type: z.string().max(80).optional().or(z.literal("")),
  salary_range: z.string().max(120).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  requirements: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export type CareerInput = z.infer<typeof schema>;

export async function createCareer(input: CareerInput) {
  const { session, db } = await requireEditor();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { data, error } = await db
    .from("careers")
    .insert({ ...parsed.data, department: parsed.data.department || null, location: parsed.data.location || null, job_type: parsed.data.job_type || null, salary_range: parsed.data.salary_range || null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "career", data.id, { title: parsed.data.title });
  await revalidateContent(["/careers"]);
  return { id: data.id };
}

export async function updateCareer(id: string, input: CareerInput) {
  const { session, db } = await requireEditor();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { error } = await db
    .from("careers")
    .update({ ...parsed.data, department: parsed.data.department || null, location: parsed.data.location || null, job_type: parsed.data.job_type || null, salary_range: parsed.data.salary_range || null })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "career", id);
  await revalidateContent(["/careers"]);
  return { ok: true };
}

export async function deleteCareer(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("careers").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "career", id);
  await revalidateContent(["/careers"]);
  return { ok: true };
}

export async function toggleCareerStatus(id: string, status: "draft" | "published" | "archived") {
  const { session, db } = await requireEditor();
  const { error } = await db.from("careers").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "career", id, { status });
  await revalidateContent(["/careers"]);
  return { ok: true };
}
