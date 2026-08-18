import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deleteService, toggleServiceStatus } from "@/lib/actions/admin/services";

export const revalidate = 0;

export default async function AdminServicesPage() {
  await guardEditor();
  let rows: {
    id: string;
    title: string;
    slug: string;
    status: string;
    featured: boolean;
    category: string;
    updated_at: string;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("services")
      .select("id, title, slug, status, featured, updated_at, service_categories(name)")
      .order("updated_at", { ascending: false });
    const raw = (data ?? []) as unknown as {
      id: string;
      title: string;
      slug: string;
      status: string;
      featured: boolean;
      updated_at: string;
      service_categories?: { name: string } | null;
    }[];
    rows = raw.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      status: s.status,
      featured: s.featured,
      category: s.service_categories?.name ?? "—",
      updated_at: s.updated_at,
    }));
  } catch {
    // Supabase not configured
  }

  return (
    <>
      <AdminPageHeader
        title="Services"
        description="Manage the services shown across your website."
        actions={
          <Link href="/admin/services/new">
            <Button>
              <AppIcon name="plus" size={16} />
              New Service
            </Button>
          </Link>
        }
      />

      <AdminTable
        rows={rows}
        columns={[
          { key: "title", header: "Title", type: "title", subKey: "slug", sortable: true },
          { key: "category", header: "Category" },
          { key: "featured", header: "Featured", type: "boolean" },
          { key: "updated_at", header: "Updated", type: "date", sortable: true },
        ]}
        searchKeys={["title", "slug"]}
        searchPlaceholder="Search services…"
        statusOptions={["draft", "published", "archived"]}
        statusKey="status"
        emptyTitle="No services yet"
        emptyDescription="Create your first service to get started."
        emptyAction={{ label: "New Service", href: "/admin/services/new" }}
        actions={{
          editBase: "/admin/services/",
          viewBase: "/services/",
          slugKey: "slug",
          statusKey: "status",
          statusOptions: ["draft", "published", "archived"],
          onStatusChange: toggleServiceStatus as never,
          onDelete: deleteService as never,
          label: "service",
        }}
      />
    </>
  );
}
