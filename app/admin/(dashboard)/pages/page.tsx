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
import { deletePage, togglePageStatus } from "@/lib/actions/admin/pages";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminPagesPage() {
  await guardEditor();
  let pages: { id: string; title: string; slug: string; status: string; updated_at: string }[] =
    [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("pages")
      .select("id, title, slug, status, updated_at")
      .order("updated_at", { ascending: false });
    pages = data ?? [];
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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-muted-foreground">
                  No pages yet — create your first page.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground">/pages/{p.slug}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(p.updated_at)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      itemId={p.id}
                      editHref={`/admin/pages/${p.id}`}
                      viewHref={`/pages/${p.slug}`}
                      status={p.status}
                      statusOptions={["draft", "published", "archived"]}
                      onStatusChange={togglePageStatus}
                      onDelete={deletePage}
                      label="page"
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
