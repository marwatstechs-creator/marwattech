"use server";

import { z } from "zod";

import { requireEditor, logActivity, revalidateContent } from "@/lib/actions/admin/helpers";
import { getSiteSettings } from "@/lib/db/content";
import { sendCourseDigest } from "@/lib/course-notifications/digest";
import type { DB } from "@/lib/actions/admin/helpers";

const courseSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  cover_image: z.string().max(2000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  duration_hours: z.number().min(0).nullable().optional(),
  is_free: z.boolean().default(false),
  price: z.number().min(0).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

const lessonSchema = z.object({
  title: z.string().min(2).max(300),
  slug: z.string().min(2).max(300).optional(),
  content: z.string().max(20000).nullable().optional(),
  video_url: z.string().max(2000).nullable().optional(),
  duration_minutes: z.number().min(0).nullable().optional(),
  is_free_preview: z.boolean().default(false),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(db: DB, base: string, ignoreId?: string): Promise<string> {
  let slug = slugify(base) || "course";
  let candidate = slug;
  let i = 2;
  for (;;) {
    let q = db.from("courses").select("id").eq("slug", candidate);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${slug}-${i}`;
    i += 1;
  }
}

/** In immediate mode, fire the digest right after a meaningful change. */
async function maybeSendImmediate(db: DB) {
  try {
    const settings = await getSiteSettings(db);
    if (settings.course_updates_enabled === "1" && settings.course_updates_mode === "immediate") {
      await sendCourseDigest({ force: true });
    }
  } catch {
    // never block the admin action on email
  }
}

/* ── Courses ─────────────────────────────────────────────────────────── */

export async function createCourse(input: z.input<typeof courseSchema>) {
  const { session, db } = await requireEditor();
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid course" };

  const slug = await uniqueSlug(db, parsed.data.slug || parsed.data.title);
  const { data, error } = await db
    .from("courses")
    .insert({
      title: parsed.data.title,
      slug,
      description: parsed.data.description ?? null,
      cover_image: parsed.data.cover_image ?? null,
      category: parsed.data.category ?? null,
      difficulty: parsed.data.difficulty,
      duration_hours: parsed.data.duration_hours ?? null,
      is_free: parsed.data.is_free,
      price: parsed.data.price ?? null,
      status: parsed.data.status,
      is_published: parsed.data.status === "published",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await logActivity(db, session, "create", "courses", data.id, { title: parsed.data.title });
  revalidateContent(["/client/courses", "/sitemap.xml"]);
  await maybeSendImmediate(db);
  return { ok: true, id: data.id };
}

export async function updateCourse(id: string, input: z.input<typeof courseSchema>) {
  const { session, db } = await requireEditor();
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid course" };

  const slug = await uniqueSlug(db, parsed.data.slug || parsed.data.title, id);
  const { error } = await db
    .from("courses")
    .update({
      title: parsed.data.title,
      slug,
      description: parsed.data.description ?? null,
      cover_image: parsed.data.cover_image ?? null,
      category: parsed.data.category ?? null,
      difficulty: parsed.data.difficulty,
      duration_hours: parsed.data.duration_hours ?? null,
      is_free: parsed.data.is_free,
      price: parsed.data.price ?? null,
      status: parsed.data.status,
      is_published: parsed.data.status === "published",
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await logActivity(db, session, "update", "courses", id, { title: parsed.data.title });
  revalidateContent(["/client/courses", "/sitemap.xml"]);
  await maybeSendImmediate(db);
  return { ok: true };
}

export async function deleteCourse(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("courses").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "courses", id);
  revalidateContent(["/client/courses", "/sitemap.xml"]);
  return { ok: true };
}

export async function setCourseStatus(id: string, status: "draft" | "published" | "archived") {
  const { session, db } = await requireEditor();
  const { error } = await db
    .from("courses")
    .update({ status, is_published: status === "published" })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "courses", id, { status });
  revalidateContent(["/client/courses", "/sitemap.xml"]);
  await maybeSendImmediate(db);
  return { ok: true };
}

/* ── Lessons ─────────────────────────────────────────────────────────── */

export async function addLesson(courseId: string, input: z.input<typeof lessonSchema>) {
  const { session, db } = await requireEditor();
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid lesson" };

  const { data: max } = await db
    .from("course_lessons")
    .select("sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("course_lessons")
    .insert({
      course_id: courseId,
      title: parsed.data.title,
      slug: slugify(parsed.data.slug || parsed.data.title) || "lesson",
      content: parsed.data.content ?? null,
      video_url: parsed.data.video_url ?? null,
      sort_order: (max?.sort_order ?? 0) + 1,
      duration_minutes: parsed.data.duration_minutes ?? null,
      is_free_preview: parsed.data.is_free_preview,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await logActivity(db, session, "create", "course_lessons", data.id, { course_id: courseId });
  revalidateContent(["/client/courses"]);
  await maybeSendImmediate(db);
  return { ok: true, id: data.id };
}

export async function updateLesson(id: string, input: z.input<typeof lessonSchema>) {
  const { session, db } = await requireEditor();
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid lesson" };

  const { error } = await db
    .from("course_lessons")
    .update({
      title: parsed.data.title,
      slug: slugify(parsed.data.slug || parsed.data.title) || "lesson",
      content: parsed.data.content ?? null,
      video_url: parsed.data.video_url ?? null,
      duration_minutes: parsed.data.duration_minutes ?? null,
      is_free_preview: parsed.data.is_free_preview,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await logActivity(db, session, "update", "course_lessons", id);
  revalidateContent(["/client/courses"]);
  await maybeSendImmediate(db);
  return { ok: true };
}

export async function deleteLesson(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("course_lessons").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "course_lessons", id);
  revalidateContent(["/client/courses"]);
  return { ok: true };
}
