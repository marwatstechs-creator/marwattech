import type { Metadata } from "next";
import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { AdSlot } from "@/components/adsense/ad-slot";
import { StudyCatalog } from "@/components/marketing/study-catalog";
import type { StudySubjectCardData } from "@/components/study/subject-card";
import { getPublishedSubjects } from "@/lib/study";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE.name} | Study Platform`,
  description:
    "University-style learning on Marwat Tech — subjects, weekly lessons and interactive slide decks for web development, design and more.",
};

export default async function StudyPage() {
  let subjects: StudySubjectCardData[] = [];
  try {
    subjects = (await getPublishedSubjects()) as StudySubjectCardData[];
  } catch {
    // Supabase not configured
  }

  return (
    <div className="container px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <AdSlot area="study-top" className="mb-8 rounded-2xl border bg-card/60 py-4" />

      <div className="mb-8">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <AppIcon name="folder" size={16} />
          Study Platform
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Learn by subject, week by week</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Choose a subject, follow the weekly lessons and flip through slide decks — with
          progress tracking, fullscreen and PDF export.
        </p>
      </div>

      <StudyCatalog kind="subjects" subjects={subjects} />

      <div className="mt-10 rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
        Looking for downloadable files and templates?{" "}
        <Link href="/study-materials" className="font-medium text-primary hover:underline">
          Browse study materials
        </Link>
      </div>

      <AdSlot area="study-between" className="mt-10 rounded-2xl border bg-card/60 py-4" />
    </div>
  );
}
