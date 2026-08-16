"use server";

import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { requireEditor, logActivity, revalidateContent } from "@/lib/actions/admin/helpers";
import { sendCourseDigest, getCourseUpdateConfig } from "@/lib/course-notifications/digest";
import { SITE } from "@/lib/constants";
import { esc, marketingEmail } from "@/lib/email/templates";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

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
  batchId?: string;
  pending?: number;
  sent?: number;
  total?: number;
  error?: string;
};

const BROADCAST_BATCH_LIMIT = 50; // per campaign click — stays within Worker limits
const SEND_CONCURRENCY = 10;
const MAX_SUBSCRIBERS = 10000;

/** Build the branded broadcast HTML for a recipient. */
function broadcastHtml(subject: string, body: string, unsubscribeUrl: string): string {
  return marketingEmail({
    subject,
    bodyHtml: `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#667085;">${body
      .split("\n")
      .map((p) => esc(p))
      .join("<br/>")}</p>`,
    unsubscribeUrl,
  });
}

/**
 * Start a broadcast to course subscribers.
 *
 * Queues up to 50 recipients as `pending` rows (one per email) so the History
 * tab can show live progress, then fires the send loop in the background
 * (kept alive via Cloudflare waitUntil when available) and returns
 * immediately — no more "hanging" while emails go out.
 *
 * Recipients who already received a send with the SAME subject are skipped,
 * so clicking again continues to the next group instead of re-sending.
 */
export async function startBroadcast(input: {
  subject: string;
  body: string;
}): Promise<BroadcastResult> {
  const { db } = await requireEditor();
  const parsed = broadcastSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (!(await isEmailConfigured())) {
    return { ok: false, error: "Email isn't configured. Add SMTP/Resend credentials in Admin → Settings → Email." };
  }

  const { data: subs } = await db
    .from("course_subscribers")
    .select("email, unsub_token")
    .eq("status", "subscribed")
    .limit(MAX_SUBSCRIBERS);
  if (!subs?.length) return { ok: false, error: "No active subscribers." };

  // Skip anyone who already got this exact subject (prevents re-send on
  // repeated clicks — the next group gets queued instead).
  const { data: prior } = await db
    .from("course_digest_sends")
    .select("email")
    .eq("subject", parsed.data.subject)
    .limit(MAX_SUBSCRIBERS);
  const priorSet = new Set((prior ?? []).map((r) => r.email));
  const recipients = subs
    .filter((s) => !priorSet.has(s.email))
    .slice(0, BROADCAST_BATCH_LIMIT);

  if (!recipients.length) return { ok: true, total: 0, sent: 0 };

  const batchId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Queue every recipient as `pending` so History shows live progress.
  const { error: insErr } = await db.from("course_digest_sends").insert(
    recipients.map((s) => ({
      email: s.email,
      courses: [],
      status: "pending",
      subject: parsed.data.subject,
      body: parsed.data.body,
      batch_id: batchId,
      sent_at: now,
    }))
  );
  if (insErr) return { ok: false, error: insErr.message };

  // Fire-and-forget the send loop; keep the isolate alive via CF waitUntil.
  const run = runBroadcastBatch(
    batchId,
    parsed.data.subject,
    parsed.data.body,
    recipients
  );
  try {
    const cf = await getCloudflareContext({ async: true });
    cf.ctx.waitUntil(run);
  } catch {
    void run; // best effort — the "Resume" button recovers if it gets killed
  }

  await logActivity(db, { user: { id: "" } } as never, "send", "course_subscribers", undefined, {
    broadcast: true,
    subject: parsed.data.subject,
    total: recipients.length,
  });

  return { ok: true, batchId, pending: recipients.length, total: recipients.length };
}

/** Send the queued pending rows of a batch, updating status live (sent/failed). */
async function runBroadcastBatch(
  batchId: string,
  subject: string,
  body: string,
  recipients: { email: string; unsub_token: string | null }[]
): Promise<number> {
  const admin = createAdminClient();
  const siteUrl = SITE.url.replace(/\/$/, "");
  let sent = 0;

  for (let i = 0; i < recipients.length; i += SEND_CONCURRENCY) {
    const chunk = recipients.slice(i, i + SEND_CONCURRENCY);
    await Promise.allSettled(
      chunk.map(async (s) => {
        await admin
          .from("course_digest_sends")
          .update({ status: "sending" })
          .eq("batch_id", batchId)
          .eq("email", s.email);
        try {
          await sendEmail({
            to: s.email,
            subject,
            html: broadcastHtml(subject, body, `${siteUrl}/unsubscribe?token=${s.unsub_token}`),
          });
          sent += 1;
          await admin
            .from("course_digest_sends")
            .update({ status: "sent", error: null })
            .eq("batch_id", batchId)
            .eq("email", s.email);
        } catch (e) {
          await admin
            .from("course_digest_sends")
            .update({
              status: "failed",
              error: (e as Error)?.message?.slice(0, 500) ?? "send failed",
            })
            .eq("batch_id", batchId)
            .eq("email", s.email);
        }
      })
    );
  }
  return sent;
}

/**
 * Resume broadcast sends stuck in `pending`/`sending` (e.g. the background
 * task was killed). Only rows older than 60s are picked up so it never
 * double-sends against a live run.
 */
export async function resumePendingSends(): Promise<BroadcastResult> {
  const { db } = await requireEditor();
  if (!(await isEmailConfigured())) {
    return { ok: false, error: "Email isn't configured." };
  }
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: stuck } = await db
    .from("course_digest_sends")
    .select("id, email, batch_id, subject, body, sent_at, status")
    .in("status", ["pending", "sending"])
    .limit(100);
  const rows = (stuck ?? []).filter(
    (r) => r.status === "pending" || (r.status === "sending" && r.sent_at < cutoff)
  );
  if (!rows.length) return { ok: true, total: 0, sent: 0 };

  // Look up unsubscribe tokens so resumed emails still have working links.
  const { data: subTokens } = await db
    .from("course_subscribers")
    .select("email, unsub_token")
    .in("email", rows.map((r) => r.email));
  const tokenByEmail = new Map((subTokens ?? []).map((s) => [s.email, s.unsub_token]));

  const admin = createAdminClient();
  const siteUrl = SITE.url.replace(/\/$/, "");
  let sent = 0;
  for (let i = 0; i < rows.length; i += SEND_CONCURRENCY) {
    const chunk = rows.slice(i, i + SEND_CONCURRENCY);
    await Promise.allSettled(
      chunk.map(async (r) => {
        if (!r.subject || !r.body || !r.email) return;
        await admin.from("course_digest_sends").update({ status: "sending" }).eq("id", r.id);
        try {
          await sendEmail({
            to: r.email,
            subject: r.subject,
            html: broadcastHtml(
              r.subject,
              r.body,
              `${siteUrl}/unsubscribe?token=${tokenByEmail.get(r.email) ?? ""}`
            ),
          });
          sent += 1;
          await admin
            .from("course_digest_sends")
            .update({ status: "sent", error: null })
            .eq("id", r.id);
        } catch (e) {
          await admin
            .from("course_digest_sends")
            .update({
              status: "failed",
              error: (e as Error)?.message?.slice(0, 500) ?? "send failed",
            })
            .eq("id", r.id);
        }
      })
    );
  }
  const result: BroadcastResult = { ok: true, sent, total: rows.length };
  if (sent < rows.length) result.error = `${rows.length - sent} failed`;
  return result;
}

/** Live send-log for the History tab (polled while a broadcast is active). */
export async function getLiveDigestSends(limit = 500) {
  const { db } = await requireEditor();
  const { data } = await db
    .from("course_digest_sends")
    .select("id, email, courses, status, error, sent_at, batch_id, subject")
    .order("sent_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as {
    id: string;
    email: string;
    courses: string[];
    status: string;
    error: string | null;
    sent_at: string;
    batch_id: string | null;
    subject: string | null;
  }[];
}

