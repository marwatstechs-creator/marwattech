import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import {
  deleteStudyMaterial,
  toggleStudyMaterial,
} from "@/lib/actions/admin/study-materials";
import { formatBytes } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminStudyMaterialsPage() {
  await guardEditor();

  let rows: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    typeLabel: string;
    is_published: boolean;
    created_at: string;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("study_materials")
      .select("*")
      .order("created_at", { ascending: false });
    rows = ((data ?? []) as unknown as {
      id: string;
      title: string;
      description: string | null;
      category: string | null;
      file_type: string | null;
      file_size: number | null;
      is_published: boolean;
      created_at: string;
    }[]).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      typeLabel: `${m.file_type?.toUpperCase() ?? "FILE"}${m.file_size != null ? ` · ${formatBytes(m.file_size)}` : ""}`,
      is_published: m.is_published,
      created_at: m.created_at,
    }));
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

      <AdminTable
        rows={rows}
        columns={[
          { key: "title", header: "Title", type: "title", subKey: "description", sortable: true },
          { key: "category", header: "Category" },
          { key: "typeLabel", header: "Type" },
          { key: "created_at", header: "Added", type: "date", sortable: true },
          { key: "is_published", header: "Published", type: "switch", switchAction: toggleStudyMaterial as never, switchLabel: "Material" },
        ]}
        searchKeys={["title", "description", "category"]}
        searchPlaceholder="Search materials…"
        emptyTitle="No study materials yet"
        emptyDescription="Add your first downloadable resource."
        emptyAction={{ label: "New Material", href: "/admin/study-materials/new" }}
        actions={{
          editBase: "/admin/study-materials/",
          statusKey: "is_published",
          statusOptions: [],
          onDelete: deleteStudyMaterial as never,
          label: "material",
        }}
      />
    </>
  );
}
