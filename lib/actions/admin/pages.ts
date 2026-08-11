"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
} from "@/lib/actions/admin/helpers";

const pageSchema = z.object({
  title: z.string().min(2, "Title is required").max(250),
  slug: z
    .string()
    .min(2)
    .max(250)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  meta_title: z.string().max(200).optional().or(z.literal("")),
  meta_description: z.string().max(300).optional().or(z.literal("")),
});

export type PageInput = z.infer<typeof pageSchema>;

export async function createPage(input: PageInput) {
  const { session, db } = await requireEditor();
  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("pages")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      content: parsed.data.content,
      status: parsed.data.status,
      meta_title: parsed.data.meta_title || null,
      meta_description: parsed.data.meta_description || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "page", data.id, { title: parsed.data.title });
  await revalidateContent(["/pages", "/", `/pages/${parsed.data.slug}`]);
  return { id: data.id };
}

export async function updatePage(id: string, input: PageInput) {
  const { session, db } = await requireEditor();
  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { error } = await db
    .from("pages")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      content: parsed.data.content,
      status: parsed.data.status,
      meta_title: parsed.data.meta_title || null,
      meta_description: parsed.data.meta_description || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "page", id);
  await revalidateContent(["/pages", "/", `/pages/${parsed.data.slug}`]);
  return { ok: true };
}

export async function deletePage(id: string) {
  const { session, db } = await requireEditor();
  const { data } = await db.from("pages").select("slug").eq("id", id).single();
  const { error } = await db.from("pages").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "page", id);
  if (data?.slug) {
    await revalidateContent(["/pages", `/pages/${data.slug}`]);
  }
  return { ok: true };
}

export async function togglePageStatus(id: string, status: "draft" | "published" | "archived") {
  const { session, db } = await requireEditor();
  const { error } = await db.from("pages").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "page", id, { status });
  await revalidateContent(["/pages", "/"]);
  return { ok: true };
}
