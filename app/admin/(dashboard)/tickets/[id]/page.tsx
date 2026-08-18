import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { TicketThread, type TicketMessage, type TicketRow } from "@/components/admin/ticket-thread";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/actions/admin/helpers";

export const revalidate = 0;

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  let ticket: TicketRow | null = null;
  let messages: TicketMessage[] = [];

  try {
    const db = await createClient();
    const [tRes, mRes] = await Promise.all([
      db
        .from("support_tickets")
        .select(
          "id, subject, issue_type, priority, status, email, name, message, internal_notes, created_at, updated_at, closed_at"
        )
        .eq("id", id)
        .maybeSingle(),
      db
        .from("ticket_messages")
        .select("id, sender_type, sender_name, sender_email, body, attachments, internal, created_at")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
    ]);
    ticket = (tRes.data ?? null) as TicketRow | null;
    messages = (mRes.data ?? []) as TicketMessage[];
  } catch {
    // fallback
  }

  if (!ticket) notFound();

  return (
    <>
      <AdminPageHeader
        title={ticket.subject ?? "Support ticket"}
        description={`Ticket #${ticket.id.slice(0, 8)}`}
        breadcrumb={[{ label: "Support", href: "/admin/tickets" }, { label: ticket.subject ?? "Ticket" }]}
        actions={
          <Link href="/admin/tickets">
            <Button variant="outline" size="sm">
              <AppIcon name="chevronLeft" size={14} />
              Back to inbox
            </Button>
          </Link>
        }
      />
      <TicketThread ticket={ticket} messages={messages} mode="admin" />
    </>
  );
}
