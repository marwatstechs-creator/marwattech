import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deleteCareer, toggleCareerStatus } from "@/lib/actions/admin/careers";

export const revalidate = 0;

export default async function AdminCareersPage() {
  await guardEditor();
  let rows: {
    id: string;
    title: string;
    department: string | null;
    location: string | null;
    job_type: string | null;
    status: string;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("careers")
      .select("id, title, department, location, job_type, status")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as typeof rows;
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Careers"
        description="Open positions listed on the careers page."
        actions={
          <Link href="/admin/careers/new">
            <Button>
              <AppIcon name="plus" size={16} />
              New Position
            </Button>
          </Link>
        }
      />

      <AdminTable
        rows={rows}
        columns={[
          { key: "title", header: "Position", type: "title", sortable: true },
          { key: "department", header: "Department" },
          { key: "location", header: "Location" },
          { key: "job_type", header: "Type" },
          { key: "status", header: "Status", type: "status" },
        ]}
        searchKeys={["title", "department", "location"]}
        searchPlaceholder="Search positions…"
        statusOptions={["draft", "published", "archived"]}
        statusKey="status"
        emptyTitle="No positions yet"
        emptyDescription="Add your first open position to get started."
        emptyAction={{ label: "New Position", href: "/admin/careers/new" }}
        actions={{
          editBase: "/admin/careers/",
          statusKey: "status",
          statusOptions: ["draft", "published", "archived"],
          onStatusChange: toggleCareerStatus as never,
          onDelete: deleteCareer as never,
          label: "position",
        }}
      />
    </>
  );
}
