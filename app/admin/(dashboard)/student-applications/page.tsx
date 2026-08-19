import { AdminPageHeader } from "@/components/admin/page-header";
import { StudentApplicationsTable } from "@/components/admin/student-applications-table";
import { listStudentApplications } from "@/lib/actions/admin/student-applications";

export const dynamic = "force-dynamic";

export default async function StudentApplicationsPage() {
  const applications = await listStudentApplications();

  return (
    <div>
      <AdminPageHeader
        title="Student Applications"
        description="Review requests from users who want to become students."
      />
      <StudentApplicationsTable applications={applications} />
    </div>
  );
}
