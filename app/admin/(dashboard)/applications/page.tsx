import { AdminPageHeader } from "@/components/admin/page-header";
import { ApplicationsTable } from "@/components/admin/applications-table";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/actions/admin/helpers";

export const revalidate = 0;

export default async function AdminApplicationsPage() {
  await requireStaff();
  let rows: (Record<string, unknown> & { id: string })[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("applications")
      .select("*, careers(title)")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as (Record<string, unknown> & { id: string })[];
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Applications"
        description="Job applications received from the careers page."
      />
      <ApplicationsTable rows={rows} />
    </>
  );
}
