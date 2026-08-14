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
import { Badge } from "@/components/ui/badge";
import { RowActions } from "@/components/admin/row-actions";
import { AsyncSwitch } from "@/components/admin/async-switch";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import {
  deleteStudyMaterial,
  toggleStudyMaterial,
} from "@/lib/actions/admin/study-materials";
import { formatDate, formatBytes } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminStudyMaterialsPage() {
  await guardEditor();

  let materials: {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    category: string | null;
    is_published: boolean;
    created_at: string;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("study_materials")
      .select("*")
      .order("created_at", { ascending: false });
    materials = data ?? [];
  } catch {
    // Supabase not configured
  }

  return (
    <>
      <AdminPageHeader
        title="Study Materials"
        description="Downloadable resources shown on the public Study Materials page."
        actions={
          <Link href="/admin/study-materials/new">
            <Button>
              <AppIcon name="plus" size={16} />
              New Material
            </Button>
          </Link>
        }
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  No study materials yet — add your first downloadable resource.
                </TableCell>
              </TableRow>
            ) : (
              materials.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <p className="font-medium">{m.title}</p>
                    <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                      {m.description}
                    </p>
                  </TableCell>
                  <TableCell>{m.category ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {m.file_type?.toUpperCase() ?? "FILE"}
                      {m.file_size != null ? ` · ${formatBytes(m.file_size)}` : ""}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(m.created_at)}
                  </TableCell>
                  <TableCell>
                    <AsyncSwitch
                      itemId={m.id}
                      checked={m.is_published}
                      action={toggleStudyMaterial}
                      label="Material"
                    />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      itemId={m.id}
                      editHref={`/admin/study-materials/${m.id}`}
                      onDelete={deleteStudyMaterial}
                      label="study material"
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
