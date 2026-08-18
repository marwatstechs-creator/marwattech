"use server";

import { z } from "zod";
import { requireEditor, logActivity, revalidateContent } from "@/lib/actions/admin/helpers";

/* ────────────────────────────────────────────────────────────────
 * Study Platform admin actions
 * University-style structure: Subject → Weeks → Slides
 * ──────────────────────────────────────────────────────────────── */

const subjectSchema = z.object({
  name: z.string().min(2, "Name is required").max(150),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  description: z.string().max(1000).optional().or(z.literal("")),
  instructor: z.string().max(150).optional().or(z.literal("")),
  category: z.string().max(80).optional().or(z.literal("")),
  color: z.string().max(40).optional().or(z.literal("")),
  published: z.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});
export type StudySubjectInput = z.infer<typeof subjectSchema>;

const weekSchema = z.object({
  subject_id: z.string().uuid("Select a subject"),
  week_number: z.coerce.number().int().min(1).max(60),
  title: z.string().min(2, "Title is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  pdf_url: z.string().max(600).optional().or(z.literal("")),
  published: z.boolean().default(false),
});
export type StudyWeekInput = z.infer<typeof weekSchema>;

const slideSchema = z.object({
  week_id: z.string().uuid("Select a week"),
  slide_number: z.coerce.number().int().min(1).max(500),
  title: z.string().min(1, "Title is required").max(250),
  content: z.string().min(1, "Content is required"),
  published: z.boolean().default(false),
});
export type StudySlideInput = z.infer<typeof slideSchema>;

/* ── Subjects ─────────────────────────────────────────────────── */

export async function getStudySubjects() {
  const { db } = await requireEditor();
  const { data: subjects } = await db
    .from("study_subjects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const list = subjects ?? [];
  const ids = list.map((s) => s.id);

  // Fetch weeks + slides without nested selects (supabase-js types have no
  // relationship metadata), then assemble counts in JS.
  let weeks: { id: string; subject_id: string }[] = [];
  if (ids.length) {
    const { data } = await db
      .from("study_weeks")
      .select("id, subject_id")
      .in("subject_id", ids);
    weeks = data ?? [];
  }
  const weekIds = weeks.map((w) => w.id);
  const slidesByWeek: Record<string, number> = {};
  if (weekIds.length) {
    const { data } = await db
      .from("study_slides")
      .select("week_id")
      .in("week_id", weekIds);
    for (const s of data ?? []) {
      slidesByWeek[s.week_id] = (slidesByWeek[s.week_id] ?? 0) + 1;
    }
  }

  return list.map((s) => {
    const subjectWeeks = weeks.filter((w) => w.subject_id === s.id);
    const slideCount = subjectWeeks.reduce((n, w) => n + (slidesByWeek[w.id] ?? 0), 0);
    return { ...s, week_count: subjectWeeks.length, slide_count: slideCount };
  });
}

export async function getStudySubject(id: string) {
  const { db } = await requireEditor();
  const { data: subject } = await db
    .from("study_subjects")
    .select("*")
    .eq("id", id)
    .single();
  if (!subject) return null;

  const { data: weeks } = await db
    .from("study_weeks")
    .select("*")
    .eq("subject_id", id)
    .order("week_number", { ascending: true });

  const weekList = weeks ?? [];
  const weekIds = weekList.map((w) => w.id);
  let slides: { id: string; week_id: string; slide_number: number; title: string; content: string; published: boolean }[] = [];
  if (weekIds.length) {
    const { data } = await db
      .from("study_slides")
      .select("id, week_id, slide_number, title, content, published")
      .in("week_id", weekIds)
      .order("slide_number", { ascending: true });
    slides = (data ?? []) as typeof slides;
  }

  const weeksWithSlides = weekList.map((w) => ({
    ...w,
    study_slides: slides.filter((s) => s.week_id === w.id),
  }));

  return { subject, weeks: weeksWithSlides };
}

export async function createStudySubject(input: StudySubjectInput) {
  const { session, db } = await requireEditor();
  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { data, error } = await db.from("study_subjects").insert(parsed.data).select("id").single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "study_subject", data.id, { name: parsed.data.name });
  await revalidateContent(["/study"]);
  return { id: data.id };
}

export async function updateStudySubject(id: string, input: StudySubjectInput) {
  const { session, db } = await requireEditor();
  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { error } = await db.from("study_subjects").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "study_subject", id, { name: parsed.data.name });
  await revalidateContent(["/study"]);
  return { ok: true };
}

export async function deleteStudySubject(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("study_subjects").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "study_subject", id);
  await revalidateContent(["/study"]);
  return { ok: true };
}

export async function toggleStudySubject(id: string, published: boolean) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("study_subjects").update({ published }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "study_subject", id, { published });
  await revalidateContent(["/study"]);
  return { ok: true };
}

/* ── Weeks ────────────────────────────────────────────────────── */

export async function createStudyWeek(input: StudyWeekInput) {
  const { session, db } = await requireEditor();
  const parsed = weekSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Auto-assign the next week number if not specified.
  let weekNumber = parsed.data.week_number;
  if (weekNumber <= 0) {
    const { data: max } = await db
      .from("study_weeks")
      .select("week_number")
      .eq("subject_id", parsed.data.subject_id)
      .order("week_number", { ascending: false })
      .limit(1);
    weekNumber = (max?.[0]?.week_number ?? 0) + 1;
  }

  const { data, error } = await db
    .from("study_weeks")
    .insert({ ...parsed.data, week_number: weekNumber, pdf_url: parsed.data.pdf_url || null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "study_week", data.id, { title: parsed.data.title });
  await revalidateContent(["/study"]);
  return { id: data.id };
}

export async function updateStudyWeek(id: string, input: StudyWeekInput) {
  const { session, db } = await requireEditor();
  const parsed = weekSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { error } = await db
    .from("study_weeks")
    .update({ ...parsed.data, pdf_url: parsed.data.pdf_url || null })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "study_week", id, { title: parsed.data.title });
  await revalidateContent(["/study"]);
  return { ok: true };
}

export async function deleteStudyWeek(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("study_weeks").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "study_week", id);
  await revalidateContent(["/study"]);
  return { ok: true };
}

export async function toggleStudyWeek(id: string, published: boolean) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("study_weeks").update({ published }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "study_week", id, { published });
  await revalidateContent(["/study"]);
  return { ok: true };
}

/* ── Slides ───────────────────────────────────────────────────── */

export async function createStudySlide(input: StudySlideInput) {
  const { session, db } = await requireEditor();
  const parsed = slideSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let slideNumber = parsed.data.slide_number;
  if (slideNumber <= 0) {
    const { data: max } = await db
      .from("study_slides")
      .select("slide_number")
      .eq("week_id", parsed.data.week_id)
      .order("slide_number", { ascending: false })
      .limit(1);
    slideNumber = (max?.[0]?.slide_number ?? 0) + 1;
  }

  const { data, error } = await db
    .from("study_slides")
    .insert({ ...parsed.data, slide_number: slideNumber })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "study_slide", data.id, { title: parsed.data.title });
  await revalidateContent(["/study"]);
  return { id: data.id };
}

export async function updateStudySlide(id: string, input: StudySlideInput) {
  const { session, db } = await requireEditor();
  const parsed = slideSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { error } = await db.from("study_slides").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "study_slide", id, { title: parsed.data.title });
  await revalidateContent(["/study"]);
  return { ok: true };
}

export async function deleteStudySlide(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("study_slides").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "study_slide", id);
  await revalidateContent(["/study"]);
  return { ok: true };
}

export async function toggleStudySlide(id: string, published: boolean) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("study_slides").update({ published }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "study_slide", id, { published });
  await revalidateContent(["/study"]);
  return { ok: true };
}

/* ── AI slide generation ──────────────────────────────────────── */

const genSlidesSchema = z.object({
  week_id: z.string().uuid("Select a week"),
  topic: z.string().min(3, "Topic is too short").max(200),
  count: z.coerce.number().int().min(4).max(20).default(8),
});

export async function generateWeekSlides(input: { week_id: string; topic: string; count?: number }) {
  const { session, db } = await requireEditor();
  const parsed = genSlidesSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { data: week } = await db.from("study_weeks").select("title, subject_id").eq("id", parsed.data.week_id).single();
  if (!week) return { error: "Week not found" };
  const { data: subject } = await db.from("study_subjects").select("name").eq("id", week.subject_id).single();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return { error: "DEEPSEEK_API_KEY is not configured on the server." };

  let reply: string;
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a university lecturer creating presentation slides. Return ONLY JSON: an array of {\"title\":string,\"content\":string(markdown, 40-120 words, with bullets/`code` where useful)} for the requested number of slides. First slide is an intro, last is a summary. No text outside the JSON.",
          },
          {
            role: "user",
            content: `Subject: ${subject?.name ?? ""} | Week: ${week.title} | Topic: ${parsed.data.topic} | Slides: ${parsed.data.count}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      cache: "no-store",
    });
    if (!res.ok) return { error: `DeepSeek API error (${res.status})` };
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
    if (data.error?.message) return { error: data.error.message };
    reply = data.choices?.[0]?.message?.content ?? "";
    if (!reply) return { error: "Empty response from DeepSeek" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }

  let slides: { title: string; content: string }[];
  try {
    const cleaned = reply.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "");
    slides = JSON.parse(cleaned) as { title: string; content: string }[];
  } catch {
    return { error: "AI returned invalid JSON — please try again." };
  }
  if (!Array.isArray(slides) || slides.length === 0) {
    return { error: "AI response was incomplete — please try again." };
  }

  // Find the next free slide number.
  const { data: max } = await db
    .from("study_slides")
    .select("slide_number")
    .eq("week_id", parsed.data.week_id)
    .order("slide_number", { ascending: false })
    .limit(1);
  const startAt = (max?.[0]?.slide_number ?? 0) + 1;

  const rows = slides.slice(0, parsed.data.count).map((s, i) => ({
    week_id: parsed.data.week_id,
    slide_number: startAt + i,
    title: s.title.slice(0, 250) || `Slide ${startAt + i}`,
    content: s.content,
    published: false,
  }));
  const { error } = await db.from("study_slides").insert(rows);
  if (error) return { error: error.message };
  await logActivity(db, session, "ai_generated_slides", "study_week", parsed.data.week_id, {
    count: rows.length,
  });
  await revalidateContent(["/study"]);
  return { ok: true, count: rows.length };
}
