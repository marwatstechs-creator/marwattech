import { AdminPageHeader } from "@/components/admin/page-header";
import {
  CourseNotificationsAdmin,
  type CourseSubscriberRow,
  type CourseUpdateEventRow,
  type CourseDigestSendRow,
  type CourseNotifConfig,
} from "@/components/admin/course-notifications-admin";
import { requireEditor } from "@/lib/actions/admin/helpers";
import { getSiteSettings } from "@/lib/db/content";
import { isEmailConfigured } from "@/lib/email";
import { createClient as createDbClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminCourseUpdatesPage() {
  await requireEditor();

  let subscribers: CourseSubscriberRow[] = [];
  let events: CourseUpdateEventRow[] = [];
  let digestSends: CourseDigestSendRow[] = [];
  let config: CourseNotifConfig = { enabled: true, mode: "digest", time: "18:00" };
  let stats = { active: 0, total: 0, pending: 0 };

  try {
    const db = await createDbClient();
    const [subs, evs, sends, settings] = await Promise.all([
      db.from("course_subscribers").select("*").order("created_at", { ascending: false }).limit(500),
      db
        .from("course_update_events")
        .select("id, course_id, event_type, summary, meaningful, included_in_digest, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("course_digest_sends").select("*").order("sent_at", { ascending: false }).limit(2000),
      getSiteSettings(db),
    ]);
    subscribers = (subs.data ?? []) as CourseSubscriberRow[];

    // Attach course titles for the events list.
    const eventRows = (evs.data ?? []) as CourseUpdateEventRow[];
    const courseIds = [...new Set(eventRows.map((e) => e.course_id))];
    const { data: courses } = courseIds.length
      ? await db.from("courses").select("id, title").in("id", courseIds)
      : { data: null };
    const titleById = new Map((courses ?? []).map((c) => [c.id, c.title]));
    events = eventRows.map((e) => ({ ...e, course_title: titleById.get(e.course_id) ?? null }));

    digestSends = (sends.data ?? []) as CourseDigestSendRow[];
    config = {
      enabled: settings.course_updates_enabled !== "0",
      mode: (settings.course_updates_mode || "digest") as "digest" | "immediate",
      time: settings.course_updates_time || "18:00",
    };

    const [a, t, p] = await Promise.all([
      db.from("course_subscribers").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
      db.from("course_subscribers").select("id", { count: "exact", head: true }),
      db
        .from("course_update_events")
        .select("id", { count: "exact", head: true })
        .eq("meaningful", true)
        .eq("included_in_digest", false),
    ]);
    stats = { active: a.count ?? 0, total: t.count ?? 0, pending: p.count ?? 0 };
  } catch {
    // fallback — empty
  }

  return (
    <>
      <AdminPageHeader
        title="Course Email Notifications"
        description="Course-update subscribers, digest settings and notification history."
      />
      <CourseNotificationsAdmin
        subscribers={subscribers}
        events={events}
        digestSends={digestSends}
        config={config}
        emailConfigured={await isEmailConfigured()}
        stats={stats}
      />
    </>
  );
}
