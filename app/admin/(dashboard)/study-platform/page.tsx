import { AdminPageHeader } from "@/components/admin/page-header";
import {
  StudyPlatformAdmin,
  type StudySubjectRow,
} from "@/components/admin/study-platform-admin";
import { getStudySubjects } from "@/lib/actions/admin/study-platform";
import { guardEditor } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminStudyPlatformPage() {
  await guardEditor();

  let subjects: StudySubjectRow[] = [];
  try {
    subjects = (await getStudySubjects()) as StudySubjectRow[];
  } catch {
    // Supabase not configured
  }

  return (
    <>
      <AdminPageHeader
        title="Study Platform"
        description="University-style learning — manage subjects, weeks and slides (each week can hold AI-generated slide decks)."
      />
      <StudyPlatformAdmin subjects={subjects} />
    </>
  );
}
