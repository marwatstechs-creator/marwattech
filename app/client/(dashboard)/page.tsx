import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/empty-state";
import { statusLabel, statusTone } from "@/components/admin/ticket-thread";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { formatDate, timeAgo } from "@/lib/utils";
import type { IconName } from "@/lib/icons";

export const revalidate = 60;

const PROJECT_STATUS_TONE: Record<string, "default" | "gold" | "azure" | "outline" | "destructive" | "secondary"> = {
  planning: "azure",
  in_progress: "default",
  review: "gold",
  completed: "secondary",
  cancelled: "destructive",
};
const PROJECT_STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  review: "In review",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function ClientDashboardPage() {
  const session = await getSessionUser();
  const clientId = session?.user.id ?? "";
  const clientEmail = session?.user.email ?? "";

  let projects = 0, activeProjects = 0, payments = 0, tickets = 0, openTickets = 0;
  let recentPayments: { id: string; amount: number; description: string | null; status: string; paid_at: string | null }[] = [];
  let recentTickets: { id: string; subject: string | null; status: string; created_at: string; updated_at: string | null }[] = [];
  let projectRows: { id: string; title: string; status: string; progress: number; created_at: string }[] = [];

  try {
    const db = await createClient();
    const [p, ap, pay, tk, okt, rp, rt, pr] = await Promise.all([
      db.from("client_projects").select("id", { count: "exact", head: true }).eq("client_id", clientId),
      db.from("client_projects").select("id", { count: "exact", head: true }).eq("client_id", clientId).in("status", ["planning", "in_progress", "review"]),
      db.from("payments").select("id", { count: "exact", head: true }).eq("client_id", clientId),
      db.from("support_tickets").select("id", { count: "exact", head: true }).eq("email", clientEmail),
      db.from("support_tickets").select("id", { count: "exact", head: true }).eq("email", clientEmail).in("status", ["new", "open", "in_progress", "waiting_on_customer"]),
      db.from("payments").select("id, amount, description, status, paid_at").eq("client_id", clientId).order("created_at", { ascending: false }).limit(5),
      db.from("support_tickets").select("id, subject, status, created_at, updated_at").eq("email", clientEmail).order("updated_at", { ascending: false }).limit(5),
      db.from("client_projects").select("id, title, status, progress, created_at").eq("client_id", clientId).order("created_at", { ascending: false }).limit(6),
    ]);
    projects = p.count ?? 0; activeProjects = ap.count ?? 0;
    payments = pay.count ?? 0; tickets = tk.count ?? 0; openTickets = okt.count ?? 0;
    recentPayments = rp.data ?? []; recentTickets = rt.data ?? []; projectRows = pr.data ?? [];
  } catch { /* fallback */ }

  const firstName = session?.profile.full_name?.split(" ")[0] ?? "there";

  return (
    <>
      <AdminPageHeader
        title={`Hello, ${firstName}`}
        description="Here’s what’s happening with your projects and support requests."
      />

      {/* Alerts */}
      {openTickets > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm">
          <AppIcon name="alert" size={18} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div className="min-w-0">
            <p className="font-semibold">You have {openTickets} open support ticket{openTickets > 1 ? "s" : ""}.</p>
            <p className="text-muted-foreground">Check your tickets for replies or follow up if you haven’t heard back.</p>
          </div>
          <Link href="/client/tickets" className="ml-auto shrink-0">
            <Button variant="outline" size="sm">View tickets</Button>
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/client/tickets" icon="chat" label="New support ticket" sub="Get help from our team" />
        <QuickAction href="/client/payments" icon="wallet" label="View payments" sub="Invoices & receipts" />
        <QuickAction href="/client/projects" icon="rocket" label="My projects" sub="Track progress" />
        <QuickAction href="/client/courses" icon="grid" label="My courses" sub="Continue learning" />
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="rocket" label="Active Projects" value={activeProjects} hint={`${projects} total`} href="/client/projects" />
        <StatCard icon="dollar" label="Payments" value={payments} href="/client/payments" />
        <StatCard icon="chat" label="Support Tickets" value={tickets} hint={openTickets > 0 ? `${openTickets} open` : "All resolved"} href="/client/tickets" />
        <StatCard icon="grid" label="Courses Enrolled" value="—" />
      </div>

      {/* Projects */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Your projects</CardTitle>
            <Link href="/client/projects"><Button variant="ghost" size="sm">View all <AppIcon name="arrowRight" size={14} /></Button></Link>
          </CardHeader>
          <CardContent>
            {projectRows.length === 0 ? (
              <EmptyState icon="rocket" title="No projects yet" description="When you start a project it will show up here." />
            ) : (
              <div className="space-y-2">
                {projectRows.map((pr) => (
                  <div key={pr.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{pr.title}</p>
                      <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, Math.max(0, pr.progress))}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant={PROJECT_STATUS_TONE[pr.status] ?? "outline"}>{PROJECT_STATUS_LABEL[pr.status] ?? pr.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Support tickets</CardTitle>
            <Link href="/client/tickets"><Button variant="ghost" size="sm">View all <AppIcon name="arrowRight" size={14} /></Button></Link>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <EmptyState icon="chat" title="No tickets yet" description="Need help? Create a ticket and our team will reply." action={{ label: "Create a ticket", href: "/technical-support" }} />
            ) : (
              <div className="space-y-2">
                {recentTickets.map((t) => (
                  <Link key={t.id} href={`/client/tickets/${t.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-accent-hover">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.subject ?? "Support ticket"}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.status === "waiting_on_customer" ? "Waiting for your reply" : timeAgo(t.updated_at ?? t.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={statusTone(t.status)}>{statusLabel(t.status)}</Badge>
                      {t.status === "waiting_on_customer" && (
                        <Badge variant="gold">Reply now</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Recent payments</CardTitle>
            <Link href="/client/payments"><Button variant="ghost" size="sm">View all <AppIcon name="arrowRight" size={14} /></Button></Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <EmptyState icon="wallet" title="No payments yet" />
            ) : (
              <div className="space-y-2">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.description ?? `$${p.amount}`}</p>
                      <p className="text-xs text-muted-foreground">{p.paid_at ? formatDate(p.paid_at) : "Pending"}</p>
                    </div>
                    <Badge variant={p.status === "completed" ? "default" : p.status === "pending" ? "gold" : "outline"}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function QuickAction({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: IconName;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <AppIcon name={icon} size={20} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold group-hover:text-primary">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: IconName;
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="icon-3d-tile grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <AppIcon name={icon} size={20} />
        </span>
      </div>
      <p className="font-display mt-4 text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="card-3d lift-3d block rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
        {body}
      </Link>
    );
  }
  return <div className="card-3d lift-3d rounded-xl border bg-card p-5">{body}</div>;
}
