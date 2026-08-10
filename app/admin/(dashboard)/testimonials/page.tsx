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
import { deleteTestimonial, toggleTestimonialStatus } from "@/lib/actions/admin/testimonials";

export const revalidate = 0;

export default async function AdminTestimonialsPage() {
  await guardEditor();
  let items: {
    id: string;
    client_name: string;
    company: string | null;
    rating: number;
    featured: boolean;
    status: string;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("testimonials")
      .select("id, client_name, company, rating, featured, status")
      .order("sort_order");
    items = data ?? [];
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Testimonials"
        description="Client feedback shown across the site."
        actions={
          <Link href="/admin/testimonials/new">
            <Button>
              <AppIcon name="plus" size={16} />
              New Testimonial
            </Button>
          </Link>
        }
      />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  No testimonials yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.client_name}</TableCell>
                  <TableCell>{t.company ?? "—"}</TableCell>
                  <TableCell className="text-gold">{"★".repeat(t.rating)}</TableCell>
                  <TableCell>{t.featured ? "★" : "—"}</TableCell>
                  <TableCell>
                    <RowActions
                      editHref={`/admin/testimonials/${t.id}`}
                      status={t.status}
                      statusOptions={["published", "draft", "archived"]}
                      onStatusChange={(status) => toggleTestimonialStatus(t.id, status as "draft" | "published" | "archived")}
                      onDelete={() => deleteTestimonial(t.id)}
                      label="testimonial"
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
