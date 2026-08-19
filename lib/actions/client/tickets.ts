"use server";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

const replySchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1, "Write a message.").max(20000),
  attachments: z.array(z.string().url()).max(5).optional().default([]),
});

/**
 * Upload ticket attachments to the public `media` bucket.
 * Returns a list of public URLs (used by both the client reply box and the
 * admin reply box).
 */
export async function uploadTicketAttachments(
  files: File[]
): Promise<{ ok: boolean; urls?: string[]; error?: string }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };

  if (files.length === 0) return { ok: true, urls: [] };
  if (files.length > 5) return { ok: false, error: "Max 5 attachments." };
  const total = files.reduce((s, f) => s + f.size, 0);
  if (total > 20 * 1024 * 1024) return { ok: false, error: "Attachments too large (max 20 MB total)." };

  // Only allow safe, previewable file types — never executables, scripts or
  // HTML/SVG that could be served as active content and harm the site.
  const ALLOWED_EXT = new Set([
    "jpg", "jpeg", "png", "gif", "webp", "bmp", "avif",
    "mp4", "webm", "mov", "m4v",
    "pdf",
    "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md",
  ]);

  try {
    const admin = createAdminClient();
    const urls: string[] = [];
    for (const file of files) {
      const ext =
        (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      if (!ALLOWED_EXT.has(ext)) {
        return { ok: false, error: `"${file.name}" is not an allowed file type.` };
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const path = `tickets/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await admin.storage
        .from("media")
        .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: true, cacheControl: "3600" });
      if (error) return { ok: false, error: error.message };
      const { data } = admin.storage.from("media").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return { ok: true, urls };
  } catch {
    return { ok: false, error: "Could not upload attachments." };
  }
}

/**
 * A logged-in customer replies to their own ticket. The ticket must match
 * the session user's email (or the client profile email).
 */
export async function replyToTicket(
  input: z.infer<typeof replySchema>
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };

  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const admin = createAdminClient();

    const { data: ticket } = await admin
      .from("support_tickets")
      .select("id, email, status")
      .eq("id", parsed.data.ticketId)
      .single();

    const customerEmail = session.user.email ?? "";
    const matches = customerEmail === ticket?.email;
    if (!ticket || !matches) {
      return { ok: false, error: "Ticket not found or you don't have access to it." };
    }
    if (ticket.status === "closed") {
      return { ok: false, error: "This ticket is closed. Open a new ticket or ask us to reopen it." };
    }

    const { error: msgErr } = await admin.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_type: "customer",
      sender_id: session.user.id,
      sender_name: session.profile.full_name || session.user.email,
      sender_email: customerEmail,
      body: parsed.data.body,
      attachments: parsed.data.attachments,
      internal: false,
    });
    if (msgErr) return { ok: false, error: "Could not send your reply. Please try again." };

    // When the customer replies, the ball is back in the staff court.
    await admin
      .from("support_tickets")
      .update({
        status: "open",
        last_message_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send your reply. Please try again." };
  }
}

/** A customer closes their own ticket. */
export async function closeOwnTicket(ticketId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };

  try {
    const admin = createAdminClient();
    const { data: ticket } = await admin
      .from("support_tickets")
      .select("id, email, status")
      .eq("id", ticketId)
      .single();
    const matches = ticket?.email === (session.user.email ?? "");
    if (!ticket || !matches) return { ok: false, error: "Ticket not found." };
    if (ticket.status === "closed") return { ok: true };

    await admin
      .from("support_tickets")
      .update({ status: "closed", closed_at: new Date().toISOString(), last_message_at: new Date().toISOString() })
      .eq("id", ticket.id);
    await admin.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_type: "system",
      sender_name: "System",
      body: "The customer closed this ticket.",
      internal: false,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not close the ticket." };
  }
}
