import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/app-icon";
import {
  StudySubjectDetailAdmin,
  type StudySubjectDetail,
  type StudyWeekRow,
} from "@/components/admin/study-platform-admin";
import { getStudySubject } from "@/lib/actions/admin/study-platform";
import { guardEditor } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminStudyPlatformDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await guardEditor();
  const { id } = await params;

  let subject: StudySubjectDetail | null = null;
  let weeks: StudyWeekRow[] = [];
  try {
    const res = await getStudySubject(id);
    if (!res) notFound();
    subject = res.subject as StudySubjectDetail;
    weeks = res.weeks as StudyWeekRow[];
  } catch {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        title={subject.name}
        description={`Manage weeks and slides for this subject.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/study/${subject.slug}`}>
              <AppIcon name="eye" size={15} className="mr-2" />
              View public
            </Link>
          </Button>
        }
      />
      <StudySubjectDetailAdmin subject={subject} weeks={weeks} />
    </>
  );
}
