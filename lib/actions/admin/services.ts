"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
} from "@/lib/actions/admin/helpers";

const serviceSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  icon: z.string().max(60).optional().or(z.literal("")),
  category_id: z.string().uuid().nullable().optional(),
  summary: z.string().max(600).optional().or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
  benefits: z.array(z.record(z.string(), z.string())).default([]),
  process: z.array(z.record(z.string(), z.string())).default([]),
  faqs: z.array(z.record(z.string(), z.string())).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  meta_title: z.string().max(200).optional().or(z.literal("")),
  meta_description: z.string().max(300).optional().or(z.literal("")),
  canonical_url: z.string().url().optional().or(z.literal("")),
  og_title: z.string().max(200).optional().or(z.literal("")),
  og_description: z.string().max(300).optional().or(z.literal("")),
  og_image: z.string().max(600).optional().or(z.literal("")),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export async function createService(input: ServiceInput) {
  const { session, db } = await requireEditor();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("services")
    .insert({ ...parsed.data, category_id: parsed.data.category_id ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "service", data.id, { title: parsed.data.title });
  await revalidateContent(["/services", "/", `/services/${parsed.data.slug}`]);
  return { id: data.id };
}

export async function updateService(id: string, input: ServiceInput) {
  const { session, db } = await requireEditor();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("services")
    .update({ ...parsed.data, category_id: parsed.data.category_id ?? null })
    .eq("id", id)
    .select("id, slug")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "service", id);
  await revalidateContent(["/services", "/", `/services/${parsed.data.slug}`]);
  return { id: data.id };
}

export async function deleteService(id: string) {
  const { session, db } = await requireEditor();
  const { data } = await db.from("services").select("slug").eq("id", id).single();
  const { error } = await db.from("services").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "service", id);
  if (data?.slug) {
    await revalidateContent(["/services", "/", `/services/${data.slug}`]);
  }
  return { ok: true };
}

export async function toggleServiceStatus(id: string, status: "draft" | "published" | "archived") {
  const { session, db } = await requireEditor();
  const { error } = await db.from("services").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "service", id, { status });
  await revalidateContent(["/services", "/"]);
  return { ok: true };
}
