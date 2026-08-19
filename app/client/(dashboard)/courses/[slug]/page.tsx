import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { CoursePlayer, type PlayerLesson } from "@/components/client/course-player";
import { CourseCertificateCard } from "@/components/certificates/course-certificate-card";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export default async function ClientCourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await getSessionUser();
  const cid = session?.user.id ?? "";

  let course: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    duration_hours: number | null;
  } | null = null;
  let lessons: PlayerLesson[] = [];
  let enrolled = false;
  let progress: Record<string, boolean> = {};
  let certificateId: string | null = null;
  let hasCertificate = false;

  try {
    const db = await createClient();
    const { data: c } = await db
      .from("courses")
      .select("id, title, description, difficulty, duration_hours")
      .eq("slug", slug)
      .single();
    if (!c) notFound();
    course = c;
    const [{ data: l }, { data: e }, { data: lp }, { data: cert }] = await Promise.all([
      db
        .from("course_lessons")
        .select(
          "id, title, content, video_url, is_free_preview, duration_hours, duration_minutes, duration_seconds"
        )
        .eq("course_id", c.id)
        .order("sort_order"),
      db.from("enrollments").select("id").eq("client_id", cid).eq("course_id", c.id).maybeSingle(),
      db.from("lesson_progress").select("lesson_id, completed").eq("client_id", cid),
      cid
        ? db
            .from("certificates")
            .select("id")
            .eq("student_id", cid)
            .eq("course_id", c.id)
            .neq("status", "revoked")
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    lessons = (l ?? []).map((x) => ({
      id: x.id,
      title: x.title,
      content: x.content ? sanitizeHtml(x.content) : null,
      has_video: !!x.video_url,
      duration_hours: x.duration_hours,
      duration_minutes: x.duration_minutes,
      duration_seconds: x.duration_seconds,
      is_free_preview: x.is_free_preview,
    }));
    enrolled = !!e;
    for (const p of lp ?? []) progress[p.lesson_id] = p.completed;
    hasCertificate = !!cert;
    certificateId = cert?.id ?? null;
  } catch {
    notFound();
  }

  const total = lessons.length;
  const done = lessons.filter((l) => progress[l.id]).length;
  const complete = total > 0 && done >= total;
  const progressPct = total ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <AdminPageHeader title={course.title} description={course.description ?? undefined} />
      <CoursePlayer
        courseId={course.id}
        courseTitle={course.title}
        difficulty={course.difficulty}
        durationHours={course.duration_hours}
        enrolled={enrolled}
        lessons={lessons}
        initialProgress={progress}
      />
      <CourseCertificateCard
        courseId={course.id}
        courseTitle={course.title}
        enrolled={enrolled}
        complete={complete}
        hasCertificate={hasCertificate}
        certificateId={certificateId}
        progressPct={progressPct}
      />
    </>
  );
}
