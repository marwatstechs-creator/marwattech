import { createClient } from "@/lib/supabase/server";

/** Published subjects with published week + slide counts (public site). */
export async function getPublishedSubjects() {
  const db = await createClient();
  const { data: subjects } = await db
    .from("study_subjects")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const list = subjects ?? [];
  const ids = list.map((s) => s.id);

  // Count published weeks per subject and published slides per week without
  // nested selects (keeps supabase-js types happy).
  let weeks: { id: string; subject_id: string }[] = [];
  if (ids.length) {
    const { data } = await db
      .from("study_weeks")
      .select("id, subject_id")
      .eq("published", true)
      .in("subject_id", ids);
    weeks = data ?? [];
  }
  const weekIds = weeks.map((w) => w.id);
  const slidesByWeek: Record<string, number> = {};
  if (weekIds.length) {
    const { data } = await db
      .from("study_slides")
      .select("week_id")
      .eq("published", true)
      .in("week_id", weekIds);
    for (const s of data ?? []) {
      slidesByWeek[s.week_id] = (slidesByWeek[s.week_id] ?? 0) + 1;
    }
  }

  return list.map((s) => {
    const publishedWeeks = weeks.filter((w) => w.subject_id === s.id);
    const slideCount = publishedWeeks.reduce((n, w) => n + (slidesByWeek[w.id] ?? 0), 0);
    return {
      ...s,
      week_count: publishedWeeks.length,
      slide_count: slideCount,
    };
  });
}

/** A published subject by slug + its published weeks (with published slide counts). */
export async function getPublishedSubjectBySlug(slug: string) {
  const db = await createClient();
  const { data: subject } = await db
    .from("study_subjects")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!subject) return null;

  const { data: weeks } = await db
    .from("study_weeks")
    .select("*")
    .eq("subject_id", subject.id)
    .eq("published", true)
    .order("week_number", { ascending: true });

  const weekList = weeks ?? [];
  const weekIds = weekList.map((w) => w.id);
  const slidesByWeek: Record<string, number> = {};
  if (weekIds.length) {
    const { data } = await db
      .from("study_slides")
      .select("week_id")
      .eq("published", true)
      .in("week_id", weekIds);
    for (const s of data ?? []) {
      slidesByWeek[s.week_id] = (slidesByWeek[s.week_id] ?? 0) + 1;
    }
  }

  return {
    subject,
    weeks: weekList.map((w) => ({ ...w, slide_count: slidesByWeek[w.id] ?? 0 })),
  };
}

/** A published week by subject slug + week number with its published slides. */
export async function getPublishedWeek(slug: string, weekNumber: number) {
  const db = await createClient();
  const { data: subject } = await db
    .from("study_subjects")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  if (!subject) return null;

  const { data: week } = await db
    .from("study_weeks")
    .select("*")
    .eq("subject_id", subject.id)
    .eq("week_number", weekNumber)
    .eq("published", true)
    .single();
  if (!week) return null;

  const { data: slides } = await db
    .from("study_slides")
    .select("*")
    .eq("week_id", week.id)
    .eq("published", true)
    .order("slide_number", { ascending: true });

  return { subject, week, slides: slides ?? [] };
}
