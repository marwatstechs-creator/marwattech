import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseVideoUrl, driveDirectUrl } from "@/lib/video";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Media proxy for Google Drive lesson videos.
 *
 * Streams the video through our own domain so the Drive URL never reaches the
 * browser (view-source and DevTools only ever see marwattech.com). Access is
 * authorized per request: staff, free-preview lessons, or enrolled students.
 * Range requests are forwarded upstream so in-page seeking works.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;

  // Authenticate
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("course_lessons")
    .select("id, course_id, video_url, is_free_preview")
    .eq("id", lessonId)
    .single();
  if (!lesson?.video_url) return new Response("Not found", { status: 404 });

  // Authorize: staff / free preview / enrolled
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const staff = ["super_admin", "editor", "support"].includes(
    String(profile?.role)
  );
  let allowed = staff || !!lesson.is_free_preview;
  if (!allowed) {
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("client_id", user.id)
      .eq("course_id", lesson.course_id)
      .maybeSingle();
    allowed = !!enrollment;
  }
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const parsed = parseVideoUrl(lesson.video_url);
  if (!parsed || parsed.kind !== "drive") {
    return new Response("Not found", { status: 404 });
  }

  // Forward the Range header so browsers can seek/scrub.
  const upstreamHeaders = new Headers();
  const range = request.headers.get("range");
  if (range) upstreamHeaders.set("Range", range);

  let res: Response;
  try {
    res = await fetch(driveDirectUrl(parsed.id), {
      headers: upstreamHeaders,
      redirect: "follow",
    });
  } catch {
    return new Response("Video unavailable", { status: 502 });
  }
  if (!res.ok && res.status !== 206) {
    return new Response("Video unavailable", { status: 502 });
  }

  const outHeaders = new Headers();
  outHeaders.set("Content-Disposition", 'inline; filename="video.mp4"');
  outHeaders.set("Cache-Control", "no-store");

  const upstreamRange = res.headers.get("content-range");
  const acceptRanges = res.headers.get("accept-ranges");
  if (upstreamRange) outHeaders.set("Content-Range", upstreamRange);
  if (acceptRanges) outHeaders.set("Accept-Ranges", acceptRanges);
  const len = res.headers.get("content-length");
  if (len) outHeaders.set("Content-Length", len);

  const ct = res.headers.get("content-type") ?? "";
  if (ct.startsWith("video/")) {
    outHeaders.set("Content-Type", ct);
  } else {
    const cd = res.headers.get("content-disposition") ?? "";
    const fileMatch = cd.match(/filename="?([^";]+)"?/i);
    const ext = (fileMatch?.[1] ?? "").toLowerCase().split(".").pop();
    const type =
      ext === "webm"
        ? "video/webm"
        : ext === "mov"
          ? "video/quicktime"
          : ext === "ogg" || ext === "ogv"
            ? "video/ogg"
            : "video/mp4";
    outHeaders.set("Content-Type", type);
  }

  return new Response(res.body, { status: res.status, headers: outHeaders });
}
