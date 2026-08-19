"use server";

import { z } from "zod";
import { requireStaff, logActivity } from "@/lib/actions/admin/helpers";
import { meetingConfirmedEmail } from "@/lib/email";

const statusSchema = z.enum(["pending", "confirmed", "completed", "cancelled"]);

const linkSchema = z.object({
  meeting_link: z
    .string()
    .url("Enter a valid meeting link (e.g. https://meet.google.com/… or a WhatsApp link)")
    .max(500),
});

const notesSchema = z.object({
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export async function updateMeetingStatus(id: string, status: z.infer<typeof statusSchema>) {
  const { session, db } = await requireStaff();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };
  const { error } = await db.from("meeting_bookings").update({ status: parsed.data }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "meeting_booking", id, { status: parsed.data });
  return { ok: true };
}

export async function updateMeetingNotes(id: string, input: z.infer<typeof notesSchema>) {
  const { session, db } = await requireStaff();
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid notes" };
  const { error } = await db.from("meeting_bookings").update({ internal_notes: parsed.data.notes || null }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update_notes", "meeting_booking", id);
  return { ok: true };
}

/**
 * Confirm a meeting with a join link. Sets status → confirmed, saves the link
 * and emails the attendee their date/time + join link (best-effort).
 */
export async function confirmMeeting(id: string, input: z.infer<typeof linkSchema>) {
  const { session, db } = await requireStaff();
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid link" };

  const { data: booking } = await db
    .from("meeting_bookings")
    .select("name, email, meeting_date, meeting_time, timezone")
    .eq("id", id)
    .single();

  const { error } = await db
    .from("meeting_bookings")
    .update({ status: "confirmed", meeting_link: parsed.data.meeting_link })
    .eq("id", id);
  if (error) return { error: error.message };

  await logActivity(db, session, "meeting_confirmed", "meeting_booking", id, {
    link: parsed.data.meeting_link,
  });

  if (booking?.email) {
    try {
      await meetingConfirmedEmail(booking.email, {
        name: booking.name ?? null,
        meeting_date: booking.meeting_date ?? "",
        meeting_time: booking.meeting_time ?? "",
        timezone: booking.timezone ?? null,
        meeting_link: parsed.data.meeting_link,
      });
    } catch {
      // email is best-effort — the booking is already confirmed
    }
  }

  return { ok: true };
}

export async function deleteMeetingBooking(id: string) {
  const { session, db } = await requireStaff();
  const { error } = await db.from("meeting_bookings").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "meeting_booking", id);
  return { ok: true };
}
