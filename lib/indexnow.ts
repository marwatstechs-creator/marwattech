import { SITE } from "@/lib/constants";

/**
 * IndexNow — the supported successor to Google's (deprecated) sitemap "ping".
 * Notifies Bing/Yandex/DuckDuckGo/Naver instantly when content changes.
 * Requires a key file hosted at https://<host>/<key>.txt (see public/).
 */
const INDEXNOW_KEY = process.env.NEXT_PUBLIC_INDEXNOW_KEY ?? "e1131074ea28e4abb2a9d15dfb2ba0d8";
const HOST = SITE.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * Ping IndexNow with the set of changed URLs. Fire-and-forget (best effort):
 * failures never block the admin action that triggered the content change.
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  const urlList = paths
    .filter(Boolean)
    .map((p) => (p.startsWith("http") ? p : `${SITE.url.replace(/\/$/, "")}${p}`));
  if (urlList.length === 0) return;

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urlList.slice(0, 10000),
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // best-effort — ignore ping failures
  }
}
