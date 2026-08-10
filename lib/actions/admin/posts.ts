"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
} from "@/lib/actions/admin/helpers";
import { readingTime } from "@/lib/utils";

const postSchema = z.object({
  title: z.string().min(2, "Title is required").max(250),
  slug: z
    .string()
    .min(2)
    .max(250)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  content: z.string().min(1, "Content is required"),
  cover_image: z.string().max(600).optional().or(z.literal("")),
  author_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  published_at: z.string().nullable().optional(),
  meta_title: z.string().max(200).optional().or(z.literal("")),
  meta_description: z.string().max(300).optional().or(z.literal("")),
  canonical_url: z.string().url().optional().or(z.literal("")),
  og_title: z.string().max(200).optional().or(z.literal("")),
  og_description: z.string().max(300).optional().or(z.literal("")),
  og_image: z.string().max(600).optional().or(z.literal("")),
});

export type PostInput = z.infer<typeof postSchema>;

/** Resolve tag names to tag IDs, creating tags on the fly. */
async function resolveTags(
  db: Awaited<ReturnType<typeof requireEditor>>["db"],
  tagNames: string[]
): Promise<{ tagIds: string[]; error?: string }> {
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug) continue;
    const { data } = await db
      .from("blog_tags")
      .upsert({ name: name.trim(), slug }, { onConflict: "slug" })
      .select("id")
      .single();
    if (data?.id) tagIds.push(data.id);
  }
  return { tagIds };
}

export async function createPost(input: PostInput) {
  const { session, db } = await requireEditor();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { content, tags, ...rest } = parsed.data;
  const { data, error } = await db
    .from("blog_posts")
    .insert({
      ...rest,
      content,
      reading_time: readingTime(content),
      published_at:
        parsed.data.status === "published"
          ? (parsed.data.published_at ?? new Date().toISOString())
          : null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { tagIds } = await resolveTags(db, tags);
  if (tagIds.length) {
    await db.from("post_tags").insert(tagIds.map((tag_id) => ({ post_id: data.id, tag_id })));
  }

  await logActivity(db, session, "create", "post", data.id, { title: parsed.data.title });
  await revalidateContent(["/blog", "/", `/blog/${parsed.data.slug}`]);
  return { id: data.id };
}

export async function updatePost(id: string, input: PostInput) {
  const { session, db } = await requireEditor();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { content, tags, ...rest } = parsed.data;
  const { error } = await db
    .from("blog_posts")
    .update({
      ...rest,
      content,
      reading_time: readingTime(content),
      published_at:
        parsed.data.status === "published"
          ? (parsed.data.published_at ?? new Date().toISOString())
          : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Sync tags
  await db.from("post_tags").delete().eq("post_id", id);
  const { tagIds } = await resolveTags(db, tags);
  if (tagIds.length) {
    await db.from("post_tags").insert(tagIds.map((tag_id) => ({ post_id: id, tag_id })));
  }

  await logActivity(db, session, "update", "post", id);
  await revalidateContent(["/blog", "/", `/blog/${parsed.data.slug}`]);
  return { ok: true };
}

export async function deletePost(id: string) {
  const { session, db } = await requireEditor();
  const { data } = await db.from("blog_posts").select("slug").eq("id", id).single();
  const { error } = await db.from("blog_posts").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "post", id);
  if (data?.slug) {
    await revalidateContent(["/blog", `/blog/${data.slug}`]);
  }
  return { ok: true };
}

export async function togglePostStatus(id: string, status: "draft" | "published" | "archived") {
  const { session, db } = await requireEditor();
  const { error } = await db.from("blog_posts").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "post", id, { status });
  await revalidateContent(["/blog", "/"]);
  return { ok: true };
}
