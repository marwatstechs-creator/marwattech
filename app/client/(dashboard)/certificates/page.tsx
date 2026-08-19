import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { AppIcon } from "@/components/app-icon";
import {
  GenerateCertificateButton,
  ViewCertificateButton,
} from "@/components/certificates/generate-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { guardClient } from "@/lib/auth";
import type { CertificateRow } from "@/lib/certificates/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Enrolled = {
  courseId: string;
  title: string;
  category: string | null;
  total: number;
  done: number;
  complete: boolean;
};

export default async function ClientCertificatesPage() {
  const session = await guardClient();
  const clientId = session.user.id;
  const db = await createClient();

  // Issued certificates
  const { data: certRows } = await db
    .from("certificates")
    .select("*")
    .eq("student_id", clientId)
    .order("created_at", { ascending: false });
  const certs = (certRows ?? []) as CertificateRow[];

  // Enrolled courses
  const { data: enrollments } = await db
    .from("enrollments")
    .select("course_id, courses(id, title, category)")
    .eq("client_id", clientId);
  const enrolled = (enrollments ?? []) as Array<{
    course_id: string;
    courses: { id: string; title: string; category: string | null } | null;
  }>;
  const courseIds = enrolled
    .map((e) => e.course_id)
    .filter((x): x is string => !!x);

  // Lessons + progress
  let lessons: Array<{ id: string; course_id: string }> = [];
  let doneLessonIds: string[] = [];
  if (courseIds.length) {
    const [l, p] = await Promise.all([
      db.from("course_lessons").select("id, course_id").in("course_id", courseIds),
      db.from("lesson_progress").select("lesson_id").eq("client_id", clientId).eq("completed", true),
    ]);
    lessons = (l.data ?? []) as typeof lessons;
    doneLessonIds = (p.data ?? []).map((r) => r.lesson_id);
  }

  const certByCourse = new Map<string, CertificateRow>();
  for (const c of certs) {
    if (c.status !== "revoked" && !certByCourse.has(c.course_id)) certByCourse.set(c.course_id, c);
  }

  const courses: Enrolled[] = enrolled.map((e) => {
    const course = e.courses;
    const courseLessons = lessons.filter((l) => l.course_id === e.course_id);
    const done = courseLessons.filter((l) => doneLessonIds.includes(l.id)).length;
    return {
      courseId: e.course_id,
      title: course?.title ?? "Course",
      category: course?.category ?? null,
      total: courseLessons.length,
      done,
      complete: courseLessons.length > 0 && done >= courseLessons.length,
    };
  });

  const eligible = courses.filter((c) => c.complete && !certByCourse.has(c.courseId));
  const inProgress = courses.filter((c) => !c.complete);
  const issued = certs.filter((c) => c.status === "issued");

  return (
    <>
      <AdminPageHeader
        title="My Certificates"
        description="Certificates are issued automatically when you complete every lesson of a course."
      />

      {/* Eligible courses → generate */}
      {eligible.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display mb-3 text-lg font-bold">
            🎓 Congratulations! You&apos;ve completed a course
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eligible.map((c) => (
              <Card key={c.courseId} className="card-3d">
                <CardHeader>
                  <CardTitle className="font-display text-base">{c.title}</CardTitle>
                  <CardDescription className="text-xs">
                    You have successfully completed this course.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <GenerateCertificateButton courseId={c.courseId} courseTitle={c.title} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Issued certificates */}
      <section className="mb-8">
        <h2 className="font-display mb-3 text-lg font-bold">Issued certificates</h2>
        {issued.length === 0 ? (
          <EmptyState
            icon="medal"
            title="No certificates yet"
            description="Finish all the lessons of a course and your certificate will appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issued.map((c) => (
              <Card key={c.id} className="card-3d overflow-hidden">
                <div
                  className="flex h-24 items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #07145C 0%, #0B1F78 60%, #06134F 100%)",
                  }}
                >
                  <AppIcon name="medal" size={34} className="text-[#D4AF37]" />
                </div>
                <CardHeader>
                  <CardTitle className="font-display line-clamp-2 text-base">{c.course_title}</CardTitle>
                  <CardDescription className="text-xs">
                    <span className="flex items-center gap-1">
                      <Badge variant="gold">{c.certificate_no}</Badge>
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <ViewCertificateButton id={c.id} />
                  <span className="text-xs text-muted-foreground">
                    {c.completion_date
                      ? new Date(`${c.completion_date}T00:00:00`).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* In progress */}
      {inProgress.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-lg font-bold">In progress</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((c) => (
              <Card key={c.courseId} className="card-3d">
                <CardHeader>
                  <CardTitle className="font-display line-clamp-2 text-base">
                    <Link href={`/client/courses`} className="hover:text-primary">
                      {c.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {c.done} / {c.total} lessons completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${c.total ? Math.round((c.done / c.total) * 100) : 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {courses.length === 0 && issued.length === 0 && (
        <div className="mt-2">
          <EmptyState
            icon="grid"
            title="You aren't enrolled in any courses yet"
            description="Browse the course catalog to start learning and earning certificates."
          />
        </div>
      )}
    </>
  );
}
