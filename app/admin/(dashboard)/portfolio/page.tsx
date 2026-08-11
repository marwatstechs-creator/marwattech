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
import {
  deletePortfolioItem,
  togglePortfolioStatus,
} from "@/lib/actions/admin/portfolio";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminPortfolioPage() {
  await guardEditor();
  let items: {
    id: string;
    title: string;
    slug: string;
    status: string;
    featured: boolean;
    updated_at: string;
    portfolio_categories?: { name: string } | null;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("portfolio_items")
      .select("id, title, slug, status, featured, updated_at, portfolio_categories(name)")
      .order("updated_at", { ascending: false });
    items = data ?? [];
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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  No projects yet — add your first one.
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">/{p.slug}</p>
                  </TableCell>
                  <TableCell>{p.portfolio_categories?.name ?? "—"}</TableCell>
                  <TableCell>{p.featured ? "★" : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(p.updated_at)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      itemId={p.id}
                      editHref={`/admin/portfolio/${p.id}`}
                      viewHref={`/portfolio/${p.slug}`}
                      status={p.status}
                      statusOptions={["draft", "published", "archived"]}
                      onStatusChange={togglePortfolioStatus}
                      onDelete={deletePortfolioItem}
                      label="project"
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
