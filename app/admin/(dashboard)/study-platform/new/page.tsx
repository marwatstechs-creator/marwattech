import { AdminPageHeader } from "@/components/admin/page-header";
import { StudySubjectForm } from "@/components/admin/study-platform-admin";
import { guardEditor } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminStudyPlatformNewPage() {
  await guardEditor();
  return (
    <>
      <AdminPageHeader title="New study subject" description="Create a subject — then add weeks and slides." />
      <StudySubjectForm />
    </>
  );
}
