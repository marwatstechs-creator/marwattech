"use server";

import { z } from "zod";

import { requireStaff } from "@/lib/actions/admin/helpers";

const TICKET_STATUSES = [
  "new",
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
] as const;
type TicketStatus = (typeof TICKET_STATUSES)[number];

const statusSchema = z.enum(TICKET_STATUSES);
const bodySchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1, "Write a reply.").max(20000),
  attachments: z.array(z.string().url()).max(5).optional().default([]),
  internal: z.boolean().optional().default(false),
});
const notesSchema = z.object({
  notes: z.string().max(4000).optional().or(z.literal("")),
});

async function touchTicket(
  db: Awaited<ReturnType<typeof requireStaff>>["db"],
  id: string,
  status: TicketStatus,
  opts?: { closedAt?: boolean }
) {
  await db
    .from("support_tickets")
    .update({
      status,
      last_message_at: new Date().toISOString(),
      ...(opts?.closedAt ? { closed_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);
}

/** Staff reply to a support ticket (creates a conversation message). */
export async function staffReplyToTicket(
  input: z.infer<typeof bodySchema>
): Promise<{ ok: boolean; error?: string }> {
  const { session, db } = await requireStaff();
  const parsed = bodySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data: ticket } = await db
    .from("support_tickets")
    .select("id, status")
    .eq("id", parsed.data.ticketId)
    .single();
  if (!ticket) return { ok: false, error: "Ticket not found." };

  const { error } = await db.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_type: "staff",
    sender_id: session.user.id,
    sender_name: session.profile.full_name || session.user.email,
    sender_email: session.user.email,
    body: parsed.data.body,
    attachments: parsed.data.attachments,
    internal: parsed.data.internal,
  });
  if (error) return { ok: false, error: "Could not send your reply." };

  // Staff sent the message → waiting on the customer (internal notes don't
  // change the public status).
  if (ticket.status !== "closed" && !parsed.data.internal) {
    await touchTicket(db, ticket.id, "waiting_on_customer");
  }
  return { ok: true };
}

/** Update a ticket's status (staff). */
export async function updateTicketStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const { session, db } = await requireStaff();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status" };

  await touchTicket(db, id, parsed.data, { closedAt: parsed.data === "closed" });
  await db.from("activity_logs").insert({
    user_id: session.user.id,
    action: "status_change",
    entity_type: "support_ticket",
    entity_id: id,
    metadata: { status: parsed.data },
  });
  return { ok: true };
}

/** Close a ticket (staff). */
export async function closeSupportTicket(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { session, db } = await requireStaff();
  const { data: ticket } = await db.from("support_tickets").select("id, status").eq("id", id).single();
  if (!ticket) return { ok: false, error: "Ticket not found." };
  if (ticket.status !== "closed") {
    await touchTicket(db, id, "closed", { closedAt: true });
    await db.from("ticket_messages").insert({
      ticket_id: id,
      sender_type: "system",
      sender_name: "System",
      body: "This ticket was closed.",
      internal: false,
    });
  }
  return { ok: true };
}

/** Reopen a closed ticket (staff). */
export async function reopenSupportTicket(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { db } = await requireStaff();
  await touchTicket(db, id, "open");
  await db.from("support_tickets").update({ closed_at: null }).eq("id", id);
  return { ok: true };
}

/** Mark a ticket as resolved (staff). */
export async function resolveSupportTicket(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { db } = await requireStaff();
  await touchTicket(db, id, "resolved");
  return { ok: true };
}

/** Set internal notes on a ticket (staff only — never shown to customer). */
export async function updateTicketNotes(
  id: string,
  input: z.infer<typeof notesSchema>
): Promise<{ ok: boolean; error?: string }> {
  const { session, db } = await requireStaff();
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid notes" };
  const { error } = await db
    .from("support_tickets")
    .update({ internal_notes: parsed.data.notes || null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await db.from("activity_logs").insert({
    user_id: session.user.id,
    action: "update_notes",
    entity_type: "support_ticket",
    entity_id: id,
  });
  return { ok: true };
}
