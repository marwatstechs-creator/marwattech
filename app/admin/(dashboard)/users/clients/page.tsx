import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { guardSuperAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminClientsPage() {
  await guardSuperAdmin();

  let clients: { id: string; full_name: string | null; email: string; role: string; created_at: string }[] = [];
  let projectsCount = 0;
  let paymentsCount = 0;

  try {
    const db = await createClient();
    const { data: profiles } = await db.from("profiles").select("id, full_name, role, created_at").eq("role", "client").order("created_at", { ascending: false });
    const { data: authUsers } = await db.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email]));
    clients = (profiles ?? []).map((p) => ({ ...p, email: emailMap.get(p.id) ?? "" }));

    const [{ count: pc }, { count: payc }] = await Promise.all([
      db.from("client_projects").select("id", { count: "exact", head: true }),
      db.from("payments").select("id", { count: "exact", head: true }),
    ]);
    projectsCount = pc ?? 0;
    paymentsCount = payc ?? 0;
  } catch { /* fallback */ }

  return (
    <>
      <AdminPageHeader title="Client Management" description="View and manage registered clients, their projects and payments." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{clients.length}</p><p className="text-xs text-muted-foreground">Clients</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{projectsCount}</p><p className="text-xs text-muted-foreground">Projects</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{paymentsCount}</p><p className="text-xs text-muted-foreground">Payments</p></CardContent></Card>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">No clients registered yet.</div>
      ) : (
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell><Badge variant="outline">{c.role}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
