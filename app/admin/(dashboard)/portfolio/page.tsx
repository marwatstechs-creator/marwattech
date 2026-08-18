import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import {
  deletePortfolioItem,
  togglePortfolioStatus,
} from "@/lib/actions/admin/portfolio";

export const revalidate = 0;

export default async function AdminPortfolioPage() {
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
      .from("portfolio_items")
      .select("id, title, slug, status, featured, updated_at, portfolio_categories(name)")
      .order("updated_at", { ascending: false });
    const raw = (data ?? []) as unknown as {
      id: string;
      title: string;
      slug: string;
      status: string;
      featured: boolean;
      updated_at: string;
      portfolio_categories?: { name: string } | null;
    }[];
    rows = raw.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      featured: p.featured,
      category: p.portfolio_categories?.name ?? "—",
      updated_at: p.updated_at,
    }));
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Portfolio"
        description="Manage your case studies and project work."
        actions={
          <Link href="/admin/portfolio/new">
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
          { key: "title", header: "Title", type: "title", subKey: "slug", sortable: true },
          { key: "category", header: "Category" },
          { key: "featured", header: "Featured", type: "boolean" },
          { key: "updated_at", header: "Updated", type: "date", sortable: true },
        ]}
        searchKeys={["title", "slug"]}
        searchPlaceholder="Search projects…"
        statusOptions={["draft", "published", "archived"]}
        statusKey="status"
        emptyTitle="No projects yet"
        emptyDescription="Add your first case study to get started."
        emptyAction={{ label: "New Project", href: "/admin/portfolio/new" }}
        actions={{
          editBase: "/admin/portfolio/",
          viewBase: "/portfolio/",
          slugKey: "slug",
          statusKey: "status",
          statusOptions: ["draft", "published", "archived"],
          onStatusChange: togglePortfolioStatus as never,
          onDelete: deletePortfolioItem as never,
          label: "project",
        }}
      />
    </>
  );
}
