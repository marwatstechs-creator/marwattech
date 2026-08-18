import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deleteTestimonial, toggleTestimonialStatus } from "@/lib/actions/admin/testimonials";

export const revalidate = 0;

export default async function AdminTestimonialsPage() {
  await guardEditor();
  let rows: {
    id: string;
    client_name: string;
    company: string | null;
    rating: number;
    featured: boolean;
    status: string;
    stars: string;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("testimonials")
      .select("id, client_name, company, rating, featured, status")
      .order("sort_order");
    rows = (data ?? []).map((t) => ({
      id: t.id,
      client_name: t.client_name,
      company: t.company,
      rating: t.rating,
      featured: t.featured,
      status: t.status,
      stars: "★".repeat(t.rating),
    }));
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

      <AdminTable
        rows={rows}
        columns={[
          { key: "client_name", header: "Client", type: "title", sortable: true },
          { key: "company", header: "Company" },
          { key: "stars", header: "Rating" },
          { key: "featured", header: "Featured", type: "boolean" },
          { key: "status", header: "Status", type: "status" },
        ]}
        searchKeys={["client_name", "company"]}
        searchPlaceholder="Search testimonials…"
        statusOptions={["published", "draft", "archived"]}
        statusKey="status"
        emptyTitle="No testimonials yet"
        emptyDescription="Add client feedback to build trust on your site."
        emptyAction={{ label: "New Testimonial", href: "/admin/testimonials/new" }}
        actions={{
          editBase: "/admin/testimonials/",
          statusKey: "status",
          statusOptions: ["published", "draft", "archived"],
          onStatusChange: toggleTestimonialStatus as never,
          onDelete: deleteTestimonial as never,
          label: "testimonial",
        }}
      />
    </>
  );
}
