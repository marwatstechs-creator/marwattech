"use server";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const emailSchema = z.string().email().max(320).toLowerCase();

/**
 * Public opt-in for Course Update Notifications.
 * Explicit consent = the visitor typing their email + submitting this form.
 * Uses the service-role client so subscriber emails are never exposed to
 * other users (RLS only allows public INSERT of a 'subscribed' row).
 */
export async function subscribeCourseUpdates(input: {
  email: string;
  website?: string;
}) {
  // Honeypot: silently drop automated spam submissions.
  if (input.website) return { ok: true };
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return { error: "Enter a valid email address." };
  const email = parsed.data;

  try {
    const db = createAdminClient();
    const { data } = await db
      .from("course_subscribers")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();
    if (data) {
      if (data.status !== "subscribed") {
        await db
          .from("course_subscribers")
          .update({ status: "subscribed", unsubscribed_at: null })
          .eq("id", data.id);
      }
    } else {
      await db.from("course_subscribers").insert({ email, status: "subscribed" });
    }
    return { ok: true };
  } catch {
    return { ok: true }; // never leak errors to the visitor
  }
}

/**
 * Public unsubscribe via per-user token — no login required.
 * Removes/disables the email from course-update notifications and stores the
 * unsubscribe timestamp. The email can re-subscribe later.
 */
export async function unsubscribeCourseByToken(token: string) {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("course_subscribers")
      .select("id, status")
      .eq("unsub_token", token)
      .maybeSingle();
    if (data && data.status === "subscribed") {
      await db
        .from("course_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
        .eq("id", data.id);
      return { ok: true, matched: true };
    }
    return { ok: true, matched: Boolean(data) };
  } catch {
    return { ok: false, matched: false };
  }
}
