"use server";

import { z } from "zod";

import { requireEditor, logActivity, revalidateContent } from "@/lib/actions/admin/helpers";
import { sendCourseDigest, getCourseUpdateConfig } from "@/lib/course-notifications/digest";

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
