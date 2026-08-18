import { sendCourseDigest } from "@/lib/course-notifications/digest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Daily course-update digest trigger.
 *
 * Called by an external scheduler (e.g. a VPS cron or cron-job.org) with the
 * configured secret, or by the admin "Send digest now" button. Sends one
 * evening digest per subscriber with all pending course updates — never
 * blocking a web request. Idempotent: events are only sent once.
 *
 *   curl -s "https://www.marwattech.com/api/cron/course-digest?secret=YOUR_SECRET"
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.COURSE_DIGEST_SECRET;
  if (secret && url.searchParams.get("secret") !== secret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendCourseDigest();
  const { ok, ...rest } = result;
  return Response.json({ ok, ...rest });
}
