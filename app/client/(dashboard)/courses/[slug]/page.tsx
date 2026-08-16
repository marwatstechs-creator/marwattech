import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize";
import { formatDuration } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export default async function ClientCourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await getSessionUser();
  const cid = session?.user.id ?? "";

  let course: { id: string; title: string; description: string | null; difficulty: string; duration_hours: number | null } | null = null;
  let lessons: { id: string; title: string; slug: string; content: string | null; video_url: string | null; sort_order: number; duration_minutes: number | null; duration_hours: number | null; duration_seconds: number | null; is_free_preview: boolean }[] = [];
  let enrolled = false;
  let progress: Map<string, boolean> = new Map();

  try {
    const db = await createClient();
    const { data: c } = await db.from("courses").select("id, title, description, difficulty, duration_hours").eq("slug", slug).single();
    if (!c) notFound();
    course = c;
    const [{ data: l }, { data: e }, { data: lp }] = await Promise.all([
      db.from("course_lessons").select("*").eq("course_id", c.id).order("sort_order"),
      db.from("enrollments").select("id").eq("client_id", cid).eq("course_id", c.id).maybeSingle(),
      db.from("lesson_progress").select("lesson_id, completed").eq("client_id", cid),
    ]);
    lessons = l ?? [];
    enrolled = !!e;
    for (const p of lp ?? []) progress.set(p.lesson_id, p.completed);
  } catch { notFound(); }

  const completed = lessons.filter(l => progress.get(l.id)).length;

  return (
    <>
      <AdminPageHeader title={course.title} description={course.description ?? undefined} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant={course.difficulty === "advanced" ? "destructive" : "default"}>{course.difficulty}</Badge>
        {course.duration_hours && <span className="text-sm text-muted-foreground">{course.duration_hours}h total</span>}
        {enrolled && <Badge variant="default">Enrolled</Badge>}
        <span className="ml-auto text-sm text-muted-foreground">{completed}/{lessons.length} lessons</span>
      </div>

      {!enrolled && (
        <Card className="mb-8 border-gold/30 bg-gold/5"><CardContent className="p-6 text-center"><p className="mb-3 text-sm text-muted-foreground">You are not enrolled in this course yet.</p><Button variant="gold">Enroll Now</Button></CardContent></Card>
      )}

      <div className="space-y-3">
        {lessons.map((l, i) => {
          const done = progress.get(l.id);
          const locked = !enrolled && !l.is_free_preview && i > 1;
          return (
            <div key={l.id} className={`rounded-xl border bg-card p-4 transition-colors ${done ? "border-primary/30 bg-primary/5" : locked ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-4">
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? <AppIcon name="check" size={16} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-medium truncate">{l.title}</h3>{l.is_free_preview && <Badge variant="gold" className="text-[10px]">Free</Badge>}{done && <Badge variant="default" className="text-[10px]">Done</Badge>}</div>
                  {formatDuration(l.duration_hours, l.duration_minutes, l.duration_seconds) && <p className="text-xs text-muted-foreground">{formatDuration(l.duration_hours, l.duration_minutes, l.duration_seconds)}</p>}
                </div>
                {l.video_url && <a href={l.video_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><AppIcon name="external" size={14} />Watch</Button></a>}
              </div>
              {enrolled && l.content && (
                <div className="mt-4 border-t pt-4 prose-cms text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(l.content) }} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
