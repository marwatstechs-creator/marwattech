import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { statusLabel, statusTone } from "@/lib/tickets";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";

export const revalidate = 60;

export default async function ClientTicketsPage() {
  const session = await getSessionUser();
  const clientEmail = session?.user.email ?? "";

  let tickets: {
    id: string;
    subject: string | null;
    issue_type: string;
    priority: string;
    status: string;
    message: string;
    created_at: string;
    updated_at: string | null;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("support_tickets")
      .select("id, subject, issue_type, priority, status, message, created_at, updated_at")
      .eq("email", clientEmail)
      .order("updated_at", { ascending: false });
    tickets = (data ?? []) as typeof tickets;
  } catch {
    // fallback
  }

  return (
    <>
      <AdminPageHeader
        title="Support Tickets"
        description="Track and reply to your support requests."
        actions={
          <a href="/technical-support">
            <Button>
              <AppIcon name="plus" size={16} />
              New ticket
            </Button>
          </a>
        }
      />

      {tickets.length === 0 ? (
        <EmptyState
          icon="chat"
          title="No support tickets yet"
          description="Need help with an order, payment, or your website? Create a ticket and our team will reply."
          action={{ label: "Create a ticket", href: "/technical-support" }}
        />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/client/tickets/${t.id}`}
              className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent-hover sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium group-hover:text-primary">
                    {t.subject ?? "Support ticket"}
                  </p>
                  <Badge variant={statusTone(t.status)}>{statusLabel(t.status)}</Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{t.message}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {t.issue_type}
                </Badge>
                <span className="whitespace-nowrap">{timeAgo(t.updated_at ?? t.created_at)}</span>
                <AppIcon
                  name="chevronRight"
                  size={16}
                  className="opacity-40 transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

