import { AdminPageHeader } from "@/components/admin/page-header";
import { CourseManager, type CourseRow, type LessonRow } from "@/components/admin/course-manager";
import { requireEditor } from "@/lib/actions/admin/helpers";
import { createClient as createDbClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminCoursesPage() {
  await requireEditor();

  let courses: CourseRow[] = [];
  let lessonsByCourse: Record<string, LessonRow[]> = {};

  try {
    const db = await createDbClient();
    const [cs, ls] = await Promise.all([
      db.from("courses").select("*").order("updated_at", { ascending: false }).limit(500),
      db
        .from("course_lessons")
        .select(
          "id, course_id, title, slug, content, video_url, sort_order, duration_minutes, duration_hours, duration_seconds, is_free_preview, created_at",
        )
        .order("sort_order", { ascending: true })
        .limit(2000),
    ]);

    const lessons = (ls.data ?? []) as LessonRow[];
    lessonsByCourse = lessons.reduce<Record<string, LessonRow[]>>((acc, l) => {
      (acc[l.course_id] ??= []).push(l);
      return acc;
    }, {});

    courses = ((cs.data ?? []) as CourseRow[]).map((c) => ({
      ...c,
      lesson_count: lessonsByCourse[c.id]?.length ?? 0,
    }));
  } catch {
    // fallback — empty
  }

  return (
    <>
      <AdminPageHeader
        title="Courses"
        description="Manage all courses from one page — filter, search, edit, publish and archive."
      />
      <CourseManager courses={courses} lessonsByCourse={lessonsByCourse} />
    </>
  );
}
