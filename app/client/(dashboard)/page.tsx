import Link from "next/link";

import { AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export default async function ClientDashboardPage() {
  const session = await getSessionUser();
  const clientId = session?.user.id ?? "";
  const clientEmail = session?.user.email ?? "";

  let projects = 0, activeProjects = 0, payments = 0, tickets = 0;
  let recentPayments: { id: string; amount: number; description: string | null; status: string; paid_at: string | null }[] = [];
  let recentTickets: { id: string; subject: string | null; status: string; created_at: string }[] = [];

  try {
    const db = await createClient();
    const [p, ap, pay, tk, rp, rt] = await Promise.all([
      db.from("client_projects").select("id", { count: "exact", head: true }).eq("client_id", clientId),
      db.from("client_projects").select("id", { count: "exact", head: true }).eq("client_id", clientId).in("status", ["planning", "in_progress"]),
      db.from("payments").select("id", { count: "exact", head: true }).eq("client_id", clientId),
      db.from("support_tickets").select("id", { count: "exact", head: true }).eq("email", clientEmail),
      db.from("payments").select("id, amount, description, status, paid_at").eq("client_id", clientId).order("created_at", { ascending: false }).limit(5),
      db.from("support_tickets").select("id, subject, status, created_at").eq("email", clientEmail).order("created_at", { ascending: false }).limit(5),
    ]);
    projects = p.count ?? 0; activeProjects = ap.count ?? 0;
    payments = pay.count ?? 0; tickets = tk.count ?? 0;
    recentPayments = rp.data ?? []; recentTickets = rt.data ?? [];
  } catch { /* fallback */ }

  return (
    <>
      <AdminPageHeader title="Client Dashboard" description={`Welcome, ${session?.profile.full_name ?? "Client"}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="rocket" label="Active Projects" value={activeProjects} hint={`${projects} total`} />
        <StatCard icon="dollar" label="Payments" value={payments} />
        <StatCard icon="chat" label="Support Tickets" value={tickets} />
        <StatCard icon="grid" label="Courses Enrolled" value="—" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-lg">Recent Payments</CardTitle><Link href="/client/payments"><Button variant="ghost" size="sm">View all <AppIcon name="arrowRight" size={14} /></Button></Link></CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No payments yet.</p> : recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="text-sm font-medium">{p.description ?? `$${p.amount}`}</p><p className="text-xs text-muted-foreground">{p.paid_at ? formatDate(p.paid_at) : "Pending"}</p></div>
                <Badge variant={p.status === "completed" ? "default" : "outline"}>{p.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-lg">Recent Tickets</CardTitle><Link href="/client/tickets"><Button variant="ghost" size="sm">View all <AppIcon name="arrowRight" size={14} /></Button></Link></CardHeader>
          <CardContent className="space-y-3">
            {recentTickets.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No tickets yet.</p> : recentTickets.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="text-sm font-medium">{t.subject ?? "Support ticket"}</p><p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p></div>
                <Badge variant={t.status === "new" ? "gold" : "outline"}>{t.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
