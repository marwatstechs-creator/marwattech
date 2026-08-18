import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deleteProject, toggleProjectStatus } from "@/lib/actions/admin/projects";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminProjectsPage() {
  await guardEditor();
  let rows: {
    id: string;
    title: string;
    client: string;
    status: string;
    progress: number;
    dates: string;
    updated_at: string;
  }[] = [];

  try {
    const db = await createClient();
    const raw = (await db
      .from("client_projects")
      .select("id, title, status, progress, start_date, end_date, updated_at, clients(company)")
      .order("updated_at", { ascending: false })).data as unknown as {
      id: string;
      title: string;
      status: string;
      progress: number;
      start_date: string | null;
      end_date: string | null;
      updated_at: string;
      clients?: { company: string } | null;
    }[];
    rows = (raw ?? []).map((p) => {
      const start = p.start_date ? formatDate(p.start_date) : "—";
      const end = p.end_date ? ` → ${formatDate(p.end_date)}` : "";
      return {
        id: p.id,
        title: p.title,
        client: p.clients?.company ?? "—",
        status: p.status,
        progress: p.progress,
        dates: `${start}${end}`,
        updated_at: p.updated_at,
      };
    });
  } catch {
    // Supabase not configured
  }

  return (
    <>
      <AdminPageHeader
        title="Projects"
        description="Track client projects, progress, dates and budgets."
        actions={
          <Link href="/admin/projects/new">
            <Button>
              <AppIcon name="plus" size={16} />
              New Project
            </Button>
          </Link>
        }
      />

      <AdminTable
        rows={rows}
        columns={[
          { key: "title", header: "Project", type: "title", sortable: true },
          { key: "client", header: "Client" },
          { key: "progress", header: "Progress", type: "progress" },
          { key: "status", header: "Status", type: "status" },
          { key: "dates", header: "Dates" },
        ]}
        searchKeys={["title", "client"]}
        searchPlaceholder="Search projects…"
        statusOptions={["planning", "in_progress", "review", "completed", "on_hold"]}
        statusKey="status"
        emptyTitle="No projects yet"
        emptyDescription="Create your first project to get started."
        emptyAction={{ label: "New Project", href: "/admin/projects/new" }}
        actions={{
          editBase: "/admin/projects/",
          statusKey: "status",
          statusOptions: ["planning", "in_progress", "review", "completed", "on_hold"],
          onStatusChange: toggleProjectStatus as never,
          onDelete: deleteProject as never,
          label: "project",
        }}
      />
    </>
  );
}
