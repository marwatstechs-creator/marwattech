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
  let courses: { id: string; title: string; slug: string; description: string | null; cover_image: string | null; category: string | null; difficulty: string; duration_hours: number | null }[] = [];
  let enrolled: Set<string> = new Set();

  try {
    const db = await createClient();
    const [c, e] = await Promise.all([
      db.from("courses").select("id, title, slug, description, cover_image, category, difficulty, duration_hours").eq("is_published", true).order("created_at", { ascending: false }),
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
                <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-lg">
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex items-start justify-between">
                      <span className="icon-3d-tile grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><AppIcon name="grid" size={24} /></span>
                      <div className="flex gap-2">
                        {isEnrolled && <Badge variant="default">Enrolled</Badge>}
                        <Badge variant={DIFF_MAP[c.difficulty] ?? "outline"}>{c.difficulty}</Badge>
                      </div>
                    </div>
                    <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                    {c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                      {c.category && <span>{c.category}</span>}
                      {c.duration_hours && <span>{c.duration_hours}h</span>}
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
