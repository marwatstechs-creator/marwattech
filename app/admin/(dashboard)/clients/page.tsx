import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/data-table";
import { createClient } from "@/lib/supabase/server";
import { guardEditor } from "@/lib/auth";
import { deleteClientRecord, toggleClientStatus } from "@/lib/actions/admin/clients";

export const revalidate = 0;

export default async function AdminClientsPage() {
  await guardEditor();
  let rows: {
    id: string;
    company: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    projects: number;
    updated_at: string;
  }[] = [];

  try {
    const db = await createClient();
    const raw = (await db
      .from("clients")
      .select("id, company, contact_name, email, phone, status, updated_at, client_projects(count)")
      .order("updated_at", { ascending: false })).data as unknown as {
      id: string;
      company: string;
      contact_name: string | null;
      email: string | null;
      phone: string | null;
      status: string;
      updated_at: string;
      client_projects?: { count: number }[];
    }[];
    rows = (raw ?? []).map((c) => ({
      id: c.id,
      company: c.company,
      contact_name: c.contact_name,
      email: c.email,
      phone: c.phone,
      status: c.status,
      projects: c.client_projects?.[0]?.count ?? 0,
      updated_at: c.updated_at,
    }));
  } catch {
    // Supabase not configured
  }

  return (
    <>
      <AdminPageHeader
        title="Clients"
        description="Manage your agency clients, contacts and their portal access."
        actions={
          <Link href="/admin/clients/new">
            <Button>
              <AppIcon name="plus" size={16} />
              New Client
            </Button>
          </Link>
        }
      />

      <AdminTable
        rows={rows}
        columns={[
          { key: "company", header: "Client", type: "title", subKey: "contact_name", sortable: true },
          { key: "email", header: "Contact" },
          { key: "projects", header: "Projects" },
          { key: "status", header: "Status", type: "status" },
          { key: "updated_at", header: "Updated", type: "date", sortable: true },
        ]}
        searchKeys={["company", "contact_name", "email", "phone"]}
        searchPlaceholder="Search clients…"
        statusOptions={["active", "inactive", "lead"]}
        statusKey="status"
        emptyTitle="No clients yet"
        emptyDescription="Create your first client to get started."
        emptyAction={{ label: "New Client", href: "/admin/clients/new" }}
        actions={{
          editBase: "/admin/clients/",
          statusKey: "status",
          statusOptions: ["active", "inactive", "lead"],
          onStatusChange: toggleClientStatus as never,
          onDelete: deleteClientRecord as never,
          label: "client",
        }}
      />
    </>
  );
}
