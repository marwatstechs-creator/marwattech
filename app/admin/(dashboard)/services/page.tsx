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
import { deleteService, toggleServiceStatus } from "@/lib/actions/admin/services";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminServicesPage() {
  await guardEditor();
  let services: {
    id: string;
    title: string;
    slug: string;
    status: string;
    featured: boolean;
    updated_at: string;
    service_categories?: { name: string } | null;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("services")
      .select("id, title, slug, status, featured, updated_at, service_categories(name)")
      .order("updated_at", { ascending: false });
    services = data ?? [];
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
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  No services yet — create your first one.
                </TableCell>
              </TableRow>
            ) : (
              services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">/{s.slug}</p>
                  </TableCell>
                  <TableCell>{s.service_categories?.name ?? "—"}</TableCell>
                  <TableCell>{s.featured ? "★" : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(s.updated_at)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      itemId={s.id}
                      editHref={`/admin/services/${s.id}`}
                      viewHref={`/services/${s.slug}`}
                      status={s.status}
                      statusOptions={["draft", "published", "archived"]}
                      onStatusChange={toggleServiceStatus}
                      onDelete={deleteService}
                      label="service"
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
