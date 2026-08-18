"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
  jsonbFromString,
} from "@/lib/actions/admin/helpers";

const itemSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  client_name: z.string().max(150).optional().or(z.literal("")),
  industry: z.string().max(120).optional().or(z.literal("")),
  summary: z.string().max(600).optional().or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
  content_json: z.string().optional().or(z.literal("")),
  technologies: z.array(z.string()).default([]),
  images: z.array(z.object({ url: z.string(), alt: z.string().optional() })).default([]),
  cover_image: z.string().max(600).optional().or(z.literal("")),
  project_url: z.string().url().optional().or(z.literal("")),
  category_id: z.string().uuid().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  meta_title: z.string().max(200).optional().or(z.literal("")),
  meta_description: z.string().max(300).optional().or(z.literal("")),
  canonical_url: z.string().url().optional().or(z.literal("")),
  og_title: z.string().max(200).optional().or(z.literal("")),
  og_description: z.string().max(300).optional().or(z.literal("")),
  og_image: z.string().max(600).optional().or(z.literal("")),
});

export type PortfolioInput = z.infer<typeof itemSchema>;

export async function createPortfolioItem(input: PortfolioInput) {
  const { session, db } = await requireEditor();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("portfolio_items")
    .insert({ ...parsed.data, content_json: jsonbFromString(parsed.data.content_json), category_id: parsed.data.category_id ?? null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "portfolio", data.id, { title: parsed.data.title });
  await revalidateContent(["/portfolio", "/", `/portfolio/${parsed.data.slug}`]);
  return { id: data.id };
}

export async function updatePortfolioItem(id: string, input: PortfolioInput) {
  const { session, db } = await requireEditor();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { error } = await db
    .from("portfolio_items")
    .update({ ...parsed.data, content_json: jsonbFromString(parsed.data.content_json), category_id: parsed.data.category_id ?? null })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "portfolio", id);
  await revalidateContent(["/portfolio", "/", `/portfolio/${parsed.data.slug}`]);
  return { ok: true };
}

export async function deletePortfolioItem(id: string) {
  const { session, db } = await requireEditor();
  const { data } = await db
    .from("portfolio_items")
    .select("slug")
    .eq("id", id)
    .single();
  const { error } = await db.from("portfolio_items").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "portfolio", id);
  if (data?.slug) {
    await revalidateContent(["/portfolio", `/portfolio/${data.slug}`]);
  }
  return { ok: true };
}

export async function togglePortfolioStatus(id: string, status: "draft" | "published" | "archived") {
  const { session, db } = await requireEditor();
  const { error } = await db.from("portfolio_items").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "portfolio", id, { status });
  await revalidateContent(["/portfolio", "/"]);
  return { ok: true };
}
