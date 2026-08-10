import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
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
import { deleteCareer, toggleCareerStatus } from "@/lib/actions/admin/careers";

export const revalidate = 0;

export default async function AdminCareersPage() {
  await guardEditor();
  let jobs: {
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
    jobs = data ?? [];
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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  No positions yet.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.title}</TableCell>
                  <TableCell>{j.department ?? "—"}</TableCell>
                  <TableCell>{j.location ?? "—"}</TableCell>
                  <TableCell>{j.job_type ?? "—"}</TableCell>
                  <TableCell>
                    <RowActions
                      editHref={`/admin/careers/${j.id}`}
                      status={j.status}
                      statusOptions={["draft", "published", "archived"]}
                      onStatusChange={(status) => toggleCareerStatus(j.id, status as "draft" | "published" | "archived")}
                      onDelete={() => deleteCareer(j.id)}
                      label="position"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
