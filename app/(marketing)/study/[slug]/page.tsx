import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { AdSlot } from "@/components/adsense/ad-slot";
import { StudyWeekList, type StudyWeekCardData } from "@/components/study/week-list";
import { getPublishedSubjectBySlug } from "@/lib/study";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const res = await getPublishedSubjectBySlug(slug);
  return {
    title: res ? `${res.subject.name} | Study · ${SITE.name}` : `${SITE.name} | Study`,
    description: res?.subject.description ?? undefined,
  };
}

export default async function StudySubjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let data: Awaited<ReturnType<typeof getPublishedSubjectBySlug>> = null;
  try {
    data = await getPublishedSubjectBySlug(slug);
  } catch {
    // Supabase not configured
  }
  if (!data) notFound();
  const { subject, weeks } = data;

  return (
    <div className="container py-10 sm:py-14">
      <AdSlot area="study-content-top" className="mb-8 rounded-2xl border bg-card/60 py-4" />

      <div className="mb-8">
        <nav className="mb-3 text-sm text-muted-foreground">
          <Link href="/study" className="hover:text-foreground">Study</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{subject.name}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
              style={{ backgroundColor: subject.color || "#7464c6" }}
            >
              {subject.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{subject.name}</h1>
              {subject.instructor && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <AppIcon name="team" size={15} />
                  Instructor: {subject.instructor}
                </p>
              )}
              {subject.description && (
                <p className="mt-2 max-w-2xl text-muted-foreground">{subject.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{weeks.length} weeks</Badge>
            <Badge variant="gold">
              {weeks.reduce((n, w) => n + w.slide_count, 0)} slides
            </Badge>
            {subject.category && <Badge variant="outline">{subject.category}</Badge>}
          </div>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl font-semibold">Weekly lessons</h2>
      <StudyWeekList
        subjectId={subject.id}
        subjectSlug={subject.slug}
        weeks={weeks as StudyWeekCardData[]}
      />

      <AdSlot area="study-content-mid" className="mt-10 rounded-2xl border bg-card/60 py-4" />
    </div>
  );
}
