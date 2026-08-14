import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowActions } from "@/components/admin/row-actions";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deleteProject, toggleProjectStatus } from "@/lib/actions/admin/projects";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

const STATUS: Record<string, { label: string; variant: "default" | "gold" | "azure" | "outline" }> = {
  planning: { label: "Planning", variant: "outline" },
  in_progress: { label: "In Progress", variant: "gold" },
  review: { label: "Review", variant: "azure" },
  completed: { label: "Completed", variant: "default" },
  on_hold: { label: "On Hold", variant: "outline" },
};

export default async function AdminProjectsPage() {
  await guardEditor();
  let projects: {
    id: string;
    title: string;
    status: string;
    progress: number;
    start_date: string | null;
    end_date: string | null;
    updated_at: string;
    clients?: { company: string } | null;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("client_projects")
      .select("id, title, status, progress, start_date, end_date, updated_at, clients(company)")
      .order("updated_at", { ascending: false });
    projects = data ?? [];
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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  No projects yet — create your first one.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((p) => {
                const st = STATUS[p.status] ?? { label: p.status, variant: "outline" as const };
                return (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-[260px]">
                      <p className="truncate font-medium">{p.title}</p>
                    </TableCell>
                    <TableCell>{p.clients?.company ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{p.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.start_date ? formatDate(p.start_date) : "—"}
                      {p.end_date ? ` → ${formatDate(p.end_date)}` : ""}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        itemId={p.id}
                        editHref={`/admin/projects/${p.id}`}
                        status={p.status}
                        statusOptions={["planning", "in_progress", "review", "completed", "on_hold"]}
                        onStatusChange={toggleProjectStatus}
                        onDelete={deleteProject}
                        label="project"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
