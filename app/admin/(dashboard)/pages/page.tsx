import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deletePage, togglePageStatus } from "@/lib/actions/admin/pages";

export const revalidate = 0;

export default async function AdminPagesPage() {
  await guardEditor();
  let rows: { id: string; title: string; slug: string; status: string; updated_at: string }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("pages")
      .select("id, title, slug, status, updated_at")
      .order("updated_at", { ascending: false });
    rows = (data ?? []) as typeof rows;
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Pages"
        description="Static pages like About, Privacy Policy and more."
        actions={
          <Link href="/admin/pages/new">
            <Button>
              <AppIcon name="plus" size={16} />
              New Page
            </Button>
          </Link>
        }
      />

      <AdminTable
        rows={rows}
        columns={[
          { key: "title", header: "Title", type: "title", subKey: "slug", sortable: true },
          { key: "status", header: "Status", type: "status" },
          { key: "updated_at", header: "Updated", type: "date", sortable: true },
        ]}
        searchKeys={["title", "slug"]}
        searchPlaceholder="Search pages…"
        statusOptions={["draft", "published", "archived"]}
        statusKey="status"
        emptyTitle="No pages yet"
        emptyDescription="Create your first static page to get started."
        emptyAction={{ label: "New Page", href: "/admin/pages/new" }}
        actions={{
          editBase: "/admin/pages/",
          viewBase: "/pages/",
          slugKey: "slug",
          statusKey: "status",
          statusOptions: ["draft", "published", "archived"],
          onStatusChange: togglePageStatus as never,
          onDelete: deletePage as never,
          label: "page",
        }}
      />
    </>
  );
}
