import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

export const revalidate = 300;

const DIFF_MAP: Record<string, "default" | "gold" | "destructive"> = {
  beginner: "default", intermediate: "gold", advanced: "destructive",
};

export default async function ClientCoursesPage() {
  const session = await getSessionUser();
  let courses: { id: string; title: string; slug: string; description: string | null; cover_image: string | null; category: string | null; difficulty: string; duration_hours: number | null; is_free: boolean }[] = [];
  let enrolled: Set<string> = new Set();

  try {
    const db = await createClient();
    const [c, e] = await Promise.all([
      db.from("courses").select("id, title, slug, description, cover_image, category, difficulty, duration_hours, is_free").eq("is_published", true).order("created_at", { ascending: false }),
      db.from("enrollments").select("course_id").eq("client_id", session?.user.id ?? ""),
    ]);
    courses = c.data ?? [];
    enrolled = new Set((e.data ?? []).map(x => x.course_id));
  } catch { /* fallback */ }

  return (
    <>
      <AdminPageHeader title="Courses" description="Browse and access your enrolled courses." />
      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-16 text-center"><p className="text-muted-foreground">No courses available yet. Check back soon!</p></div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(c => {
            const isEnrolled = enrolled.has(c.id);
            return (
              <Link key={c.id} href={`/client/courses/${c.slug}`} className="group block h-full">
                <Card className="h-full overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-lg">
                  {/* Cover thumbnail */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                    {c.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.cover_image}
                        alt={c.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center" style={{ background: "linear-gradient(135deg, #7464c6 0%, #4b3ea1 100%)" }}>
                        <AppIcon name="layers" size={40} className="text-white/40" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <Badge variant={c.is_free ? "gold" : "default"}>{c.is_free ? "Free" : "Paid"}</Badge>
                      {isEnrolled && <Badge variant="default" className="bg-background/80 backdrop-blur">Enrolled</Badge>}
                    </div>
                  </div>
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={DIFF_MAP[c.difficulty] ?? "outline"} className="capitalize">{c.difficulty}</Badge>
                      {c.category && <span className="truncate text-xs text-muted-foreground">{c.category}</span>}
                    </div>
                    <h3 className="font-display text-lg font-semibold leading-snug">{c.title}</h3>
                    {c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><AppIcon name="play" size={13} /> Lessons</span>
                      {c.duration_hours ? <span>{c.duration_hours}h</span> : <span>&nbsp;</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
