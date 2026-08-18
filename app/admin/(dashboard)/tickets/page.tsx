import { AdminPageHeader } from "@/components/admin/page-header";
import { TicketInbox } from "@/components/admin/ticket-inbox";
import { AppIcon } from "@/components/app-icon";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/actions/admin/helpers";

export const revalidate = 0;

export default async function AdminTicketsPage() {
  await requireStaff();

  let tickets: {
    id: string;
    subject: string | null;
    issue_type: string;
    priority: string;
    status: string;
    email: string;
    name: string;
    message: string;
    internal_notes: string | null;
    created_at: string;
    updated_at: string | null;
    closed_at: string | null;
  }[] = [];

  try {
    const db = await createClient();
    const { data } = await db
      .from("support_tickets")
      .select(
        "id, subject, issue_type, priority, status, email, name, message, internal_notes, created_at, updated_at, closed_at"
      )
      .order("updated_at", { ascending: false });
    tickets = (data ?? []) as typeof tickets;
  } catch {
    // fallback
  }

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => ["new", "open", "in_progress", "waiting_on_customer"].includes(t.status)).length,
    new: tickets.filter((t) => t.status === "new").length,
  };

  return (
    <>
      <AdminPageHeader
        title="Support Tickets"
        description={`${counts.open} open · ${counts.new} new · ${counts.total} total`}
        actions={
          <a
            href="/technical-support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent-hover"
          >
            <AppIcon name="plus" size={15} />
            New ticket
          </a>
        }
      />
      <TicketInbox tickets={tickets} />
    </>
  );
}
