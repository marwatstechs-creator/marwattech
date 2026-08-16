export type VideoKind = "youtube" | "drive" | "other";

export type ParsedVideo = { kind: "youtube" | "drive"; id: string };

/**
 * Parse a pasted lesson media link into a provider + id.
 * Supports YouTube (watch / youtu.be / shorts / embed / v=) and
 * Google Drive share links (file/d/<id>/view, open?id=, uc?...&id=).
 * Returns null when the URL isn't a supported video.
 */
export function parseVideoUrl(
  url: string | null | undefined
): ParsedVideo | null {
  if (!url) return null;
  const raw = url.trim();
  if (!/^https?:\/\//i.test(raw)) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const path = parsed.pathname;

  // ── YouTube ────────────────────────────────────────────────────────────
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "music.youtube.com"
  ) {
    const v = parsed.searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{6,}$/.test(v)) return { kind: "youtube", id: v };
    // /embed/<id>, /shorts/<id>, /v/<id>, /live/<id>
    const m = path.match(/^\/(?:embed|shorts|v|live)\/([A-Za-z0-9_-]{6,})/);
    if (m) return { kind: "youtube", id: m[1] };
    // /watch/... fallback
    const w = path.match(/^\/watch\/([A-Za-z0-9_-]{6,})/);
    if (w) return { kind: "youtube", id: w[1] };
  }
  if (host === "youtu.be") {
    const m = path.match(/^\/([A-Za-z0-9_-]{6,})/);
    if (m) return { kind: "youtube", id: m[1] };
  }

  // ── Google Drive ───────────────────────────────────────────────────────
  const driveHosts = [
    "drive.google.com",
    "drive.usercontent.google.com",
    "docs.google.com",
  ];
  if (driveHosts.includes(host)) {
    // drive.google.com/file/d/<ID>/view | edit | preview
    const f = path.match(/^\/file\/d\/([A-Za-z0-9_-]{20,})/);
    if (f) return { kind: "drive", id: f[1] };
    // open?id= / uc?export=..&id= / download?id=
    const id = parsed.searchParams.get("id");
    if (id && /^[A-Za-z0-9_-]{20,}$/.test(id)) return { kind: "drive", id };
    // docs.google.com /uc?export=download&id=...
    const u = path.match(/^\/uc\?/);
    if (u && id && /^[A-Za-z0-9_-]{20,}$/.test(id)) return { kind: "drive", id };
  }

  return null;
}

/** Minimal, no-label YouTube embed URL (privacy-enhanced, no related videos,
 * no logo animation). */
export function youtubeEmbedUrl(id: string): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    color: "white",
    iv_load_policy: "3",
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

/**
 * Server-side source for a public Google Drive file. This URL is only ever
 * fetched by our media proxy (or a server) — it is never sent to the client.
 */
export function driveDirectUrl(id: string): string {
  return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`;
}

/** Classic Drive download endpoint — used as a fallback when the primary URL
 * fails or returns an interstitial (it auto-redirects to usercontent). */
export function driveFallbackUrl(id: string): string {
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
}

/**
 * Google Drive shows an HTML "this file can't be scanned" interstitial page
 * for larger files instead of the video. The page embeds a hidden `uuid`
 * (confirm) token inside a form — extract it so we can retry with
 * `confirm=<token>`.
 */
export function extractDriveConfirmToken(html: string): string | null {
  if (!html) return null;
  // <input type="hidden" name="uuid" value="..." />
  const m = html.match(/name=["']uuid["'][^>]*value=["']([^"']+)["']/i);
  if (m && /^[A-Za-z0-9_-]{8,}$/.test(m[1])) return m[1];
  // alternate markup: value then name
  const m2 = html.match(/value=["']([A-Za-z0-9_-]{8,})["'][^>]*name=["']uuid["']/i);
  if (m2) return m2[1];
  return null;
}

/**
 * Resolve the correct video MIME type. Prefers an upstream video/* type; falls
 * back to sniffing the filename extension, then a sensible default.
 */
export function inferVideoContentType(
  contentType: string | null | undefined,
  filename?: string | null
): string {
  const ct = contentType?.trim().toLowerCase() ?? "";
  if (ct.startsWith("video/")) return ct;
  // `filename` may be a Content-Disposition header — pull out the real filename.
  let file = (filename ?? "").trim();
  const cdMatch = file.match(/filename="?([^";]+)"?/i);
  if (cdMatch) file = cdMatch[1];
  const ext = file.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    qt: "video/quicktime",
    ogv: "video/ogg",
    ogg: "video/ogg",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    mpeg: "video/mpeg",
  };
  return byExt[ext] ?? "video/mp4";
}

/** Build a `Content-Range` header value for a byte range response. */
export function formatContentRange(
  start: number,
  end: number,
  total: number
): string {
  return `bytes ${start}-${end}/${total}`;
}
