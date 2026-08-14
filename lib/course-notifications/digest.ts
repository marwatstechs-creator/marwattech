/**
 * Course-update digest engine.
 *
 * Collects pending "meaningful" course/lesson changes (logged by DB triggers),
 * groups them by course, and sends one branded evening digest per subscriber
 * with a per-recipient unsubscribe link. Events are marked `included_in_digest`
 * after a successful run so nothing is ever sent twice.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/db/content";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { courseUpdateEmail } from "@/lib/email/templates";
import { SITE } from "@/lib/constants";

export type DigestResult = {
  ok: boolean;
  reason?: string;
  sent?: number;
  total?: number;
  error?: string;
};

const BATCH_SIZE = 12;
const MAX_EVENTS = 200;
const MAX_SUBSCRIBERS = 10000;

/** Read the course-update config from site_settings (with sane defaults). */
export async function getCourseUpdateConfig(db: ReturnType<typeof createAdminClient>) {
  const settings = await getSiteSettings(db);
  return {
    enabled: settings.course_updates_enabled !== "0",
    mode: (settings.course_updates_mode || "digest") as "digest" | "immediate",
    time: settings.course_updates_time || "18:00",
  };
}

/**
 * Send the pending course-update digest to all active subscribers.
 * `force` bypasses the enabled flag (used by the admin "Send digest now").
 */
export async function sendCourseDigest(opts: { force?: boolean } = {}): Promise<DigestResult> {
  const db = createAdminClient();
  try {
    const config = await getCourseUpdateConfig(db);
    if (!config.enabled && !opts.force) return { ok: true, reason: "disabled" };
    if (!(await isEmailConfigured())) return { ok: true, reason: "email-not-configured" };

    // 1) Pending meaningful events
    const { data: events } = await db
      .from("course_update_events")
      .select("id, course_id, event_type, summary")
      .eq("meaningful", true)
      .eq("included_in_digest", false)
      .order("created_at", { ascending: true })
      .limit(MAX_EVENTS);
    if (!events?.length) return { ok: true, reason: "no-events" };

    // 2) Only published courses are announced (draft/archived edits are admin work).
    const courseIds = [...new Set(events.map((e) => e.course_id))];
    const { data: courses } = await db
      .from("courses")
      .select("id, title, slug, status")
      .in("id", courseIds);
    const published = new Map<string, { title: string; url: string }>();
    for (const c of courses ?? []) {
      if (c.status === "published") {
        published.set(c.id, {
          title: c.title,
          url: `${SITE.url.replace(/\/$/, "")}/client/courses/${c.slug}`,
        });
      }
    }

    const groups = new Map<string, { title: string; url: string; summaryPoints: string[] }>();
    for (const e of events) {
      const c = published.get(e.course_id);
      if (!c) continue;
      const g = groups.get(e.course_id) ?? { title: c.title, url: c.url, summaryPoints: [] };
      if (e.summary) g.summaryPoints.push(e.summary);
      groups.set(e.course_id, g);
    }
    const courseList = [...groups.values()].sort((a, b) => a.title.localeCompare(b.title));
    if (!courseList.length) return { ok: true, reason: "no-published-courses" };

    const includedEventIds = events.filter((e) => published.has(e.course_id)).map((e) => e.id);

    // 3) Active subscribers
    const { data: subs } = await db
      .from("course_subscribers")
      .select("email, unsub_token")
      .eq("status", "subscribed")
      .limit(MAX_SUBSCRIBERS);
    if (!subs?.length) return { ok: true, reason: "no-subscribers" };

    // Dedup: skip subscribers who already received THIS exact digest (safe if a
    // run is cut short by Worker limits and the cron fires again — no duplicates).
    let alreadySent = new Set<string>();
    if (includedEventIds.length) {
      const { data: sentRows } = await db
        .from("course_digest_sends")
        .select("email")
        .eq("status", "sent")
        .contains("event_ids", includedEventIds)
        .limit(MAX_SUBSCRIBERS);
      alreadySent = new Set((sentRows ?? []).map((r) => r.email));
    }
    const recipients = subs.filter((s) => !alreadySent.has(s.email));
    if (!recipients.length) {
      // Everyone already got this digest — just close out the pending events.
      await db
        .from("course_update_events")
        .update({ included_in_digest: true })
        .in("id", includedEventIds);
      return { ok: true, reason: "already-sent" };
    }

    const siteUrl = SITE.url.replace(/\/$/, "");
    const subject =
      courseList.length > 1
        ? "Course updates — see what's new 📚"
        : "Your course has been updated 📚";
    const courseNames = courseList.map((c) => c.title);

    // 4) Send per-recipient (unique unsubscribe token) in small batches.
    let sent = 0;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (s) => {
          await sendEmail({
            to: s.email,
            subject,
            html: courseUpdateEmail({
              courses: courseList,
              recipientEmail: s.email,
              unsubscribeUrl: `${siteUrl}/unsubscribe?token=${s.unsub_token}`,
            }),
          });
          sent += 1;
          await db.from("course_digest_sends").insert({
            email: s.email,
            event_ids: includedEventIds,
            courses: courseNames,
            status: "sent",
          });
        }),
      );
      results.forEach((r, idx) => {
        if (r.status === "rejected") {
          const reason = (r.reason as Error)?.message ?? "send failed";
          // Best-effort failure log (don't await — non-blocking).
          void db
            .from("course_digest_sends")
            .insert({
              email: batch[idx].email,
              event_ids: includedEventIds,
              courses: courseNames,
              status: "failed",
              error: reason.slice(0, 500),
            })
            .then(() => {});
        }
      });
    }

    // 5) Mark events as included ONLY when every remaining recipient was sent,
    //    so a partial run leaves events pending (dedup skips the ones already
    //    delivered on the next run instead of re-sending).
    if (sent === recipients.length && recipients.length > 0) {
      await db
        .from("course_update_events")
        .update({ included_in_digest: true })
        .in("id", includedEventIds);
    }

    return {
      ok: true,
      sent,
      total: recipients.length,
      ...(sent < recipients.length ? { error: `${recipients.length - sent} recipient(s) failed` } : {}),
    };
  } catch (err) {
    return { ok: false, error: (err as Error)?.message ?? "digest failed" };
  }
}
