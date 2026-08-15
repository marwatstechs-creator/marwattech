"use server";

import { z } from "zod";

import { requireEditor, logActivity, revalidateContent } from "@/lib/actions/admin/helpers";
import { sendCourseDigest, getCourseUpdateConfig } from "@/lib/course-notifications/digest";
import { SITE } from "@/lib/constants";
import { esc } from "@/lib/email/templates";

const emailSchema = z.string().email().max(320).toLowerCase();

/* ── Subscriber management ───────────────────────────────────────────── */

export async function addCourseSubscriber(input: { email: string }) {
  const { session, db } = await requireEditor();
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return { error: "Invalid email" };

  const { data, error } = await db
    .from("course_subscribers")
    .select("id, status")
    .eq("email", parsed.data)
    .maybeSingle();
  if (error) return { error: error.message };

  if (data) {
    if (data.status !== "subscribed") {
      const u = await db
        .from("course_subscribers")
        .update({ status: "subscribed", unsubscribed_at: null })
        .eq("id", data.id);
      if (u.error) return { error: u.error.message };
    }
  } else {
    const ins = await db.from("course_subscribers").insert({ email: parsed.data, status: "subscribed" });
    if (ins.error) return { error: ins.error.message };
  }

  await logActivity(db, session, "update", "course_subscribers", undefined, { email: parsed.data });
  revalidateContent(["/admin/course-updates"]);
  return { ok: true };
}

export async function setCourseSubscriberStatus(id: string, status: "subscribed" | "unsubscribed") {
  const { session, db } = await requireEditor();
  const patch =
    status === "subscribed"
      ? { status, unsubscribed_at: null }
      : { status, unsubscribed_at: new Date().toISOString() };
  const { error } = await db.from("course_subscribers").update(patch).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "course_subscribers", id, { status });
  revalidateContent(["/admin/course-updates"]);
  return { ok: true };
}

export async function deleteCourseSubscriber(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("course_subscribers").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "course_subscribers", id);
  revalidateContent(["/admin/course-updates"]);
  return { ok: true };
}

/* ── Configuration ───────────────────────────────────────────────────── */

export async function saveCourseNotificationConfig(input: {
  enabled: boolean;
  mode: "digest" | "immediate";
  time: string;
}) {
  const { session, db } = await requireEditor();
  if (!/^\d{2}:\d{2}$/.test(input.time)) return { error: "Delivery time must be HH:MM (24h)." };

  const rows = [
    { key: "course_updates_enabled", value: input.enabled ? "1" : "0" },
    { key: "course_updates_mode", value: input.mode },
    { key: "course_updates_time", value: input.time },
  ];
  for (const row of rows) {
    const { error } = await db.from("site_settings").upsert(row, { onConflict: "key" });
    if (error) return { error: error.message };
  }
  await logActivity(db, session, "update", "settings", undefined, { keys: rows.map((r) => r.key) });
  revalidateContent(["/admin/course-updates"]);
  return { ok: true };
}

/** Admin-triggered digest send (force = runs even when the feature is off). */
export async function sendCourseDigestNow() {
  await requireEditor();
  const result = await sendCourseDigest({ force: true });
  return result;
}

/** Read config for the admin panel. */
export async function getCourseNotificationConfig() {
  const { db } = await requireEditor();
  return getCourseUpdateConfig(db);
}

/* ── Manual broadcast to all course subscribers ─────────────────────── */

const broadcastSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Message is required").max(10000),
});

export type BroadcastResult = {
  ok: boolean;
  sent?: number;
  total?: number;
  error?: string;
};

/**
 * Sends a custom branded email to every active course subscriber, with a
 * per-recipient unsubscribe link. Capped per invocation (like the digest) so
 * the Cloudflare Worker stays within its resource limits — call repeatedly to
 * reach the whole list. Uses the RLS client (subscribers are public) so no
 * admin service-role client is needed.
 */
export async function sendSubscriberBroadcast(input: {
  subject: string;
  body: string;
}): Promise<BroadcastResult> {
  const { db } = await requireEditor();
  const parsed = broadcastSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  if (!(await isEmailConfigured())) {
    return { ok: false, error: "Email isn't configured. Add SMTP/Resend credentials in Admin → Settings → Email." };
  }

  const { data: subs } = await db
    .from("course_subscribers")
    .select("email, unsub_token")
    .eq("status", "subscribed")
    .limit(10000);
  if (!subs?.length) return { ok: false, error: "No active subscribers." };

  // Cap per run to stay within Cloudflare Worker limits.
  const toSend = subs.slice(0, 50);
  const siteUrl = SITE.url.replace(/\/$/, "");
  const { marketingEmail } = await import("@/lib/email/templates");
  const { sendEmail } = await import("@/lib/email");

  let sent = 0;
  for (let i = 0; i < toSend.length; i += 10) {
    const batch = toSend.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (s) => {
        await sendEmail({
          to: s.email,
          subject: parsed.data.subject,
          html: marketingEmail({
            subject: parsed.data.subject,
            bodyHtml: `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#667085;">${parsed.data.body
              .split("\n")
              .map((p) => esc(p))
              .join("<br/>")}</p>`,
            unsubscribeUrl: `${siteUrl}/unsubscribe?token=${s.unsub_token}`,
          }),
        });
        sent += 1;
      })
    );
    // Log failures for the history tab (best effort).
    results.forEach((r, idx) => {
      if (r.status === "rejected") {
        void db
          .from("course_digest_sends")
          .insert({
            email: batch[idx].email,
            courses: [],
            status: "failed",
            error: ((r.reason as Error)?.message ?? "send failed").slice(0, 500),
          })
          .then(() => {});
      }
    });
  }

  await logActivity(db, { user: { id: "" } } as never, "send", "course_subscribers", undefined, {
    broadcast: true,
    subject: parsed.data.subject,
    total: toSend.length,
  });

  const result: BroadcastResult = { ok: true, sent, total: toSend.length };
  if (sent < toSend.length) {
    result.error = `${toSend.length - sent} recipient(s) failed`;
  }
  return result;
}

