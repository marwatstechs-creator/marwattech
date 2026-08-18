import Link from "next/link";

import { AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/empty-state";
import { BarChart, DonutChart } from "@/components/admin/charts";
import { statusLabel, statusTone } from "@/components/admin/ticket-thread";
import { createClient } from "@/lib/supabase/server";
import { canManageContent, isSuperAdmin } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";
import { timeAgo, cn } from "@/lib/utils";
import { formatMoney } from "@/lib/payments/config";
import type { IconName } from "@/lib/icons";

export const revalidate = 60;

type Activity = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  created_at: string;
};

const ACTIVITY_LABELS: Record<string, { label: string; icon: IconName; tone: "gold" | "azure" | "emerald" | "primary" }> = {
  create: { label: "Created", icon: "plus", tone: "emerald" },
  update: { label: "Updated", icon: "pencil", tone: "azure" },
  delete: { label: "Deleted", icon: "delete", tone: "primary" },
  status_change: { label: "Changed status", icon: "refresh", tone: "gold" },
  publish: { label: "Published", icon: "check", tone: "emerald" },
  update_notes: { label: "Updated notes", icon: "edit", tone: "azure" },
  login: { label: "Signed in", icon: "login", tone: "azure" },
  contact: { label: "New message", icon: "message", tone: "gold" },
  payment: { label: "Payment", icon: "wallet", tone: "emerald" },
  ticket: { label: "New ticket", icon: "chat", tone: "gold" },
};

export default async function AdminDashboardPage() {
  const session = await getSessionUser();

  const stats = {
    services: 0,
    posts: 0,
    projects: 0,
    unread: 0,
    codeScripts: 0,
    payments: 0,
    paymentsCollected: 0,
    newTickets: 0,
    newApplications: 0,
    openTickets: 0,
  };
  let collectedCurrencies: string[] = [];
  let activity: Activity[] = [];
  let revenueByMonth: { label: string; value: number }[] = [];
  let ticketStatuses: { status: string; count: number }[] = [];
  let recentTickets: {
    id: string;
    subject: string | null;
    status: string;
    priority: string;
    created_at: string;
  }[] = [];

  try {
    const db = await createClient();
    const now = new Date();

    const [
      services, posts, projects, codeScripts,
      newContact, newTickets, newMockup, newApplications, openTickets,
      msgRows, activityRows, ticketRows, paymentRows,
    ] = await Promise.all([
      db.from("services").select("id", { count: "exact", head: true }),
      db.from("blog_posts").select("id", { count: "exact", head: true }),
      db.from("portfolio_items").select("id", { count: "exact", head: true }),
      db.from("code_scripts").select("id", { count: "exact", head: true }).eq("status", "published"),
      db.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
      db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "new"),
      db.from("mockup_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      db.from("applications").select("id", { count: "exact", head: true }).eq("status", "new"),
      db.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["new", "open", "in_progress", "waiting_on_customer"]),
      db.from("contact_messages").select("name, email, subject, created_at").order("created_at", { ascending: false }).limit(4),
      db.from("activity_logs").select("id, action, entity_type, entity_id, metadata, created_at").order("created_at", { ascending: false }).limit(12),
      db.from("support_tickets").select("id, subject, status, priority, created_at").order("updated_at", { ascending: false }).limit(5),
      db.from("payments").select("amount, currency, created_at").eq("status", "completed"),
    ]);

    stats.services = services.count ?? 0;
    stats.posts = posts.count ?? 0;
    stats.projects = projects.count ?? 0;
    stats.codeScripts = codeScripts.count ?? 0;
    stats.newTickets = newTickets.count ?? 0;
    stats.openTickets = openTickets.count ?? 0;
    stats.newApplications = newApplications.count ?? 0;
    stats.unread = (newContact.count ?? 0) + (newTickets.count ?? 0) + (newMockup.count ?? 0);

    const completed = (paymentRows.data ?? []) as { amount: number; currency: string; created_at: string }[];
    stats.payments = completed.length;
    stats.paymentsCollected = completed.reduce((s, r) => s + Number(r.amount), 0);
    collectedCurrencies = Array.from(new Set(completed.map((r) => r.currency)));

    // Revenue by month (last 6 months).
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-US", { month: "short" }) });
    }
    const byMonth = new Map<string, number>();
    for (const p of completed) {
      const key = p.created_at.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(p.amount));
    }
    revenueByMonth = months.map((m) => ({ label: m.label, value: Math.round(byMonth.get(m.key) ?? 0) }));

    // Ticket status distribution.
    const statusCount = new Map<string, number>();
    for (const t of ticketRows.data ?? []) {
      const s = (t as { status: string }).status;
      statusCount.set(s, (statusCount.get(s) ?? 0) + 1);
    }
    ticketStatuses = Array.from(statusCount.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
    recentTickets = (ticketRows.data ?? []) as typeof recentTickets;
    activity = (activityRows.data ?? []) as Activity[];

    void msgRows;
  } catch {
    // Supabase not configured
  }

  const role = session?.profile.role;
  const editor = role ? canManageContent(role) : false;
  const admin = role ? isSuperAdmin(role) : false;

  const revenueLabel =
    stats.paymentsCollected > 0 && collectedCurrencies.length === 1
      ? formatMoney(stats.paymentsCollected, collectedCurrencies[0])
      : stats.payments > 0
        ? `${stats.payments} tx`
        : "0";

  return (
    <>
      <AdminPageHeader
        title={`Welcome${session?.profile.full_name ? `, ${session.profile.full_name.split(" ")[0]}` : ""}`}
        description="Here’s what’s happening across your site today."
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon="code" label="Services" value={stats.services} href="/admin/services" />
        <StatCard icon="file" label="Blog posts" value={stats.posts} href="/admin/blog" />
        <StatCard icon="layers" label="Portfolio items" value={stats.projects} href="/admin/portfolio" />
        <StatCard icon="box" label="Code scripts" value={stats.codeScripts} href="/admin/code-scripts" />
        <StatCard
          icon="message"
          label="Unread messages"
          value={stats.unread}
          hint="Contact, support & mockups"
          href="/admin/messages"
          accent="gold"
        />
        <StatCard
          icon="wallet"
          label="Revenue"
          value={revenueLabel}
          hint={`${stats.payments} total transactions`}
          href="/admin/payments"
          accent="emerald"
        />
      </div>

      {/* Charts + attention */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Revenue (last 6 months)</CardTitle>
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm">
                Details
                <AppIcon name="arrowRight" size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {revenueByMonth.every((m) => m.value === 0) ? (
              <EmptyState icon="chart" title="No revenue yet" description="Completed payments will appear here as a monthly chart." />
            ) : (
              <BarChart data={revenueByMonth} formatValue={(v) => String(v)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Tickets by status</CardTitle>
            <Link href="/admin/tickets">
              <Button variant="ghost" size="sm">
                View
                <AppIcon name="arrowRight" size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ticketStatuses.length === 0 ? (
              <EmptyState icon="chat" title="No tickets yet" />
            ) : (
              <DonutChart
                segments={ticketStatuses.map((s, i) => ({
                  label: statusLabel(s.status),
                  value: s.count,
                  color: ["#e11d48", "#f59e0b", "#0ea5e9", "#10b981", "#6b7280", "#64748b"][i % 6],
                }))}
                centerValue={ticketStatuses.reduce((s, x) => s + x.count, 0)}
                centerLabel="tickets"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attention needed + activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Needs attention</CardTitle>
            <Link href="/admin/tickets">
              <Button variant="ghost" size="sm">Open tickets</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <AttentionLink href="/admin/messages" icon="message" label="New messages" value={stats.unread} tone="gold" />
              <AttentionLink href="/admin/tickets" icon="chat" label="Open tickets" value={stats.openTickets} tone="azure" />
              <AttentionLink href="/admin/applications" icon="userAdd" label="New applications" value={stats.newApplications} tone="emerald" />
            </div>

            {recentTickets.length > 0 && (
              <div className="mt-2 border-t pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Latest tickets
                </p>
                <div className="space-y-1.5">
                  {recentTickets.map((t) => (
                    <Link
                      key={t.id}
                      href={`/admin/tickets/${t.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent-hover"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">{t.subject ?? "Support ticket"}</span>
                      <Badge variant={statusTone(t.status)} className="shrink-0">{statusLabel(t.status)}</Badge>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(t.created_at)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState icon="activity" title="No activity yet" />
            ) : (
              <ol className="space-y-3">
                {activity.map((a) => {
                  const meta = ACTIVITY_LABELS[a.action] ?? { label: a.action, icon: "activity" as IconName, tone: "primary" as const };
                  const entityName = (a.metadata as { title?: string } | null)?.title ?? a.entity_type ?? "";
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "icon-3d-tile mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
                          meta.tone === "gold" && "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
                          meta.tone === "azure" && "bg-sky-500/15 text-sky-600 dark:text-sky-400",
                          meta.tone === "emerald" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                          meta.tone === "primary" && "bg-primary/10 text-primary"
                        )}
                      >
                        <AppIcon name={meta.icon} size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          <span className="font-medium">{meta.label}</span>
                          {entityName && <span className="text-muted-foreground"> · {entityName}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      {editor && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold">Quick actions</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink href="/admin/services/new" icon="plus" label="New service" />
            <QuickLink href="/admin/blog/new" icon="plus" label="New blog post" />
            <QuickLink href="/admin/payments" icon="wallet" label="View payments" />
            <QuickLink href="/admin/media" icon="upload" label="Upload media" />
          </div>
        </div>
      )}

      {admin && (
        <p className="mt-8 text-xs text-muted-foreground">
          You have super admin access — use it wisely.
        </p>
      )}
    </>
  );
}

function AttentionLink({
  href,
  icon,
  label,
  value,
  tone,
}: {
  href: string;
  icon: IconName;
  label: string;
  value: number;
  tone: "gold" | "azure" | "emerald";
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "icon-3d-tile grid size-9 place-items-center rounded-lg",
            tone === "gold" && "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
            tone === "azure" && "bg-sky-500/15 text-sky-600 dark:text-sky-400",
            tone === "emerald" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          )}
        >
          <AppIcon name={icon} size={17} />
        </span>
        <span className="font-display text-2xl font-bold">{value}</span>
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{label}</p>
    </Link>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "plus" | "upload" | "wallet";
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
        <AppIcon name={icon} size={18} />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
