import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/adsense/ad-slot";
import { SlideViewer, type SlideData } from "@/components/study/slide-viewer";
import { getPublishedWeek } from "@/lib/study";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; week: string }>;
}): Promise<Metadata> {
  const { slug, week } = await params;
  const res = await getPublishedWeek(slug, Number(week));
  return {
    title: res ? `${res.week.title} | Study · ${SITE.name}` : `${SITE.name} | Study`,
  };
}

export default async function StudyWeekPage({
  params,
}: {
  params: Promise<{ slug: string; week: string }>;
}) {
  const { slug, week } = await params;
  let data: Awaited<ReturnType<typeof getPublishedWeek>> = null;
  try {
    data = await getPublishedWeek(slug, Number(week));
  } catch {
    // Supabase not configured
  }
  if (!data) notFound();
  const { subject, week: weekData, slides } = data;

  return (
    <div className="container py-10 sm:py-14">
      <AdSlot area="study-content-top" className="mb-8 rounded-2xl border bg-card/60 py-4" />

      <SlideViewer
        slides={slides as SlideData[]}
        subjectName={subject.name}
        subjectSlug={subject.slug}
        weekTitle={weekData.title}
        weekNumber={weekData.week_number}
        pdfUrl={weekData.pdf_url}
      />

      <AdSlot area="study-content-mid" className="mt-10 rounded-2xl border bg-card/60 py-4" />
      <AdSlot area="study-content-bottom" className="mt-4 rounded-2xl border bg-card/60 py-4" />
    </div>
  );
}
