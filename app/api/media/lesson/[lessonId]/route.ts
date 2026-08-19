import { getCloudflareContext } from "@opennextjs/cloudflare";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseVideoUrl,
  driveDirectUrl,
  driveFallbackUrl,
  extractDriveConfirmToken,
  inferVideoContentType,
  formatContentRange,
} from "@/lib/video";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_KEY = (lessonId: string) => `lessons/${lessonId}`;

/* Minimal R2 typing (workers-types isn't in this project's tsconfig). */
type R2Range = { offset: number; length?: number };
type R2Object = {
  key: string;
  size: number;
  body: ReadableStream | null;
  httpMetadata?: { contentType?: string };
  range?: R2Range | null;
};
type R2Bucket = {
  get(
    key: string,
    options?: { range?: R2Range | null }
  ): Promise<R2Object | null>;
  put(
    key: string,
    body: ReadableStream | null,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
};

/**
 * Media proxy for Google Drive lesson videos.
 *
 * Streams the video through our own domain so the Drive URL never reaches the
 * browser. Access is authorized per request (staff, free-preview, or enrolled).
 *
 * Reliability:
 *  - R2 caching: the full file is copied into R2 on first play; later requests
 *    (including seek/Range requests) are served straight from R2 — fast and
 *    never re-touches slow Drive.
 *  - Google's "file can't be scanned" HTML interstitial (common for files
 *    >~100 MB) is detected and retried with the embedded confirm token.
 *  - Falls back to the classic `uc?export=download` endpoint when needed.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const range = request.headers.get("range");

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

  // Authorize: staff / approved student (free preview or enrolled).
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const staff = ["super_admin", "editor", "support"].includes(
    String(profile?.role)
  );
  const isStudent = String(profile?.role) === "student";
  if (!staff && !isStudent) return new Response("Forbidden", { status: 403 });
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

  // Resolve Cloudflare context + R2 bucket (may be absent → graceful fallback).
  let bucket: R2Bucket | undefined;
  let cfCtx: { waitUntil: (p: Promise<unknown>) => void } | null = null;
  try {
    const cf = await getCloudflareContext({ async: true });
    bucket = (cf.env as Record<string, unknown>).COURSE_MEDIA as
      | R2Bucket
      | undefined;
    cfCtx = cf.ctx;
  } catch {
    bucket = undefined;
  }

  const key = CACHE_KEY(lessonId);

  // 1) Serve from R2 if already cached (fast + seekable).
  if (bucket) {
    try {
      const cached = range
        ? await bucket.get(key, { range: parseRange(range) })
        : await bucket.get(key);
      if (cached) {
        const headers = new Headers();
        headers.set(
          "Content-Type",
          cached.httpMetadata?.contentType ??
            inferVideoContentType(null, cached.key)
        );
        headers.set("Accept-Ranges", "bytes");
        headers.set("Cache-Control", "private, max-age=300");

        if (cached.range) {
          const start = cached.range.offset;
          const length = cached.range.length ?? cached.size - start;
          const end = start + length - 1;
          headers.set(
            "Content-Range",
            formatContentRange(start, end, cached.size)
          );
          headers.set("Content-Length", String(length));
          return new Response(cached.body, { status: 206, headers });
        }
        headers.set("Content-Length", String(cached.size));
        return new Response(cached.body, { status: 200, headers });
      }
    } catch {
      // R2 read failed — fall through to Drive streaming.
    }
  }

  // 2) Fetch from Drive (handles the interstitial + fallback endpoint).
  const driveRes = await fetchDriveMedia(parsed.id, range);
  if (!driveRes) return new Response("Video unavailable", { status: 502 });

  const outHeaders = new Headers();
  outHeaders.set(
    "Content-Type",
    inferVideoContentType(
      driveRes.headers.get("content-type"),
      driveRes.headers.get("content-disposition")
    )
  );
  outHeaders.set("Cache-Control", "private");

  const upstreamRange = driveRes.headers.get("content-range");
  const acceptRanges = driveRes.headers.get("accept-ranges");
  if (upstreamRange) outHeaders.set("Content-Range", upstreamRange);
  if (acceptRanges) outHeaders.set("Accept-Ranges", acceptRanges);
  const len = driveRes.headers.get("content-length");
  if (len) outHeaders.set("Content-Length", len);

  // 3) Background-cache the FULL file into R2 so future plays are instant.
  //    Only cache whole-file (non-range) responses to avoid partial objects.
  if (bucket && cfCtx && !range && !upstreamRange) {
    const putPromise = bucket
      .put(key, driveRes.clone().body, { httpMetadata: { contentType: inferVideoContentType(driveRes.headers.get("content-type"), driveRes.headers.get("content-disposition")) } })
      .catch(() => null);
    cfCtx.waitUntil(putPromise);
  }

  return new Response(driveRes.body, {
    status: driveRes.status === 206 ? 206 : 200,
    headers: outHeaders,
  });
}

/** Parse a "bytes=start-end" / "bytes=start-" header into an R2 range object. */
function parseRange(header: string): { offset: number; length?: number } | null {
  const m = header.match(/^bytes=(\d*)-(\d*)$/i);
  if (!m || (m[1] === "" && m[2] === "")) return null;
  const start = m[1] === "" ? undefined : Number(m[1]);
  const end = m[2] === "" ? undefined : Number(m[2]);
  if (start !== undefined && !Number.isFinite(start)) return null;
  if (end !== undefined && !Number.isFinite(end)) return null;
  if (start === undefined)
    return { offset: 0, length: end ? end + 1 : undefined };
  if (end === undefined) return { offset: start };
  return { offset: start, length: end - start + 1 };
}

/**
 * Fetch a Drive file, retrying through Google's virus-scan interstitial
 * (large files return an HTML "can't be scanned" page; we extract the confirm
 * token and retry) and falling back to the classic download endpoint.
 */
async function fetchDriveMedia(
  id: string,
  range?: string | null
): Promise<Response | null> {
  const withHeaders = (url: string) =>
    fetch(url, {
      headers: range ? { Range: range } : {},
      redirect: "follow",
      cache: "no-store",
    });

  try {
    let res = await withHeaders(driveDirectUrl(id));
    if (!isHtml(res)) return res.ok || res.status === 206 ? res : null;

    const html = await res.text();
    const token = extractDriveConfirmToken(html);
    if (token) {
      const retry = await withHeaders(
        `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=${encodeURIComponent(token)}`
      );
      if (!isHtml(retry)) return retry.ok || retry.status === 206 ? retry : null;
    }
    // Last resort: classic endpoint (auto-redirects with its own confirm).
    const fallback = await withHeaders(driveFallbackUrl(id));
    if (!isHtml(fallback)) return fallback.ok || fallback.status === 206 ? fallback : null;
    return null;
  } catch {
    return null;
  }
}

function isHtml(res: Response): boolean {
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("text/html") || ct.includes("text/plain");
}
