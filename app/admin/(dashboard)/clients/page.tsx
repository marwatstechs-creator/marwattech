import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { deleteClientRecord, toggleClientStatus } from "@/lib/actions/admin/clients";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

const STATUS: Record<string, { label: string; variant: "default" | "gold" | "azure" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "outline" },
  lead: { label: "Lead", variant: "gold" },
};

export default async function AdminClientsPage() {
  await guardEditor();
  let clients: {
    id: string;
    company: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    updated_at: string;
    client_projects?: { count: number }[];
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("clients")
      .select("id, company, contact_name, email, phone, status, updated_at, client_projects(count)")
      .order("updated_at", { ascending: false });
    clients = data ?? [];
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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                  No clients yet — create your first one.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((c) => {
                const st = STATUS[c.status] ?? { label: c.status, variant: "outline" as const };
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.company}</p>
                      {c.contact_name && <p className="text-xs text-muted-foreground">{c.contact_name}</p>}
                    </TableCell>
                    <TableCell>
                      {c.email && <p className="text-xs">{c.email}</p>}
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </TableCell>
                    <TableCell>{c.client_projects?.[0]?.count ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.updated_at)}</TableCell>
                    <TableCell>
                      <RowActions
                        itemId={c.id}
                        editHref={`/admin/clients/${c.id}`}
                        status={c.status}
                        statusOptions={["active", "inactive", "lead"]}
                        onStatusChange={toggleClientStatus}
                        onDelete={deleteClientRecord}
                        label="client"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
